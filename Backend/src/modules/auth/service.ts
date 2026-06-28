import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { config } from '../../config/index.js';
import { authRepository } from './repository.js';
import { UserModel } from './schema.js';
import { UserRole, JWTPayload, UserSession } from './types.js';
import {
  AuthenticationError,
  ValidationError,
  ConflictError,
  NotFoundError,
  AuthorizationError
} from '../../shared/errors/AppError.js';
import { emailQueue } from '../../shared/queue/bullmq.js';
import { templates } from '../../shared/providers/email.provider.js';
import { logger } from '../../shared/logs/logger.js';

export class AuthService {
  // Helper: Generate JWT tokens
  private generateTokens(payload: JWTPayload): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(payload, config.JWT_ACCESS_SECRET, {
      expiresIn: config.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn']
    });

    const refreshToken = jwt.sign({ id: payload.id }, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn']
    });

    return { accessToken, refreshToken };
  }

  // Register User
  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    role: UserRole;
  }) {
    const existingUser = await authRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Set default permissions based on Role
    const permissions = this.getDefaultPermissions(data.role);

    const user = await authRepository.create({
      ...data,
      permissions,
      isVerified: false
    } as any);

    // Generate & send verification OTP
    await this.sendVerificationOtp(user.email);

    return user;
  }

  // Login User
  async login(credentials: {
    email: string;
    password: string;
    deviceInfo?: string;
    ipAddress?: string;
  }) {
    const user = await authRepository.findOne({ email: credentials.email });
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isMatch) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new AuthenticationError('Please verify your email address before logging in');
    }

    const payload: JWTPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };

    const { accessToken, refreshToken } = this.generateTokens(payload);

    // Save refresh token session
    const session: UserSession = {
      token: refreshToken,
      deviceInfo: credentials.deviceInfo,
      ipAddress: credentials.ipAddress,
      lastUsedAt: new Date()
    };
    await authRepository.addRefreshToken(user._id.toString(), session);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };
  }

  // Refresh Access Token using Rotation & Reuse Detection
  async refresh(params: {
    refreshToken: string;
    deviceInfo?: string;
    ipAddress?: string;
  }) {
    let decoded: any;
    try {
      decoded = jwt.verify(params.refreshToken, config.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const user = await authRepository.findById(decoded.id);
    if (!user) {
      throw new AuthenticationError('User session not found');
    }

    // Check if token exists in session
    const activeSession = user.refreshTokens.find((t) => t.token === params.refreshToken);

    if (!activeSession) {
      // Security Risk: Refresh token reuse detected!
      // Revoke ALL active sessions for this user (Token Theft)
      await authRepository.clearAllRefreshTokens(user._id.toString());
      throw new AuthorizationError('Security breach: Refresh token reuse detected. All sessions revoked.');
    }

    // IP and Device Fingerprint Binding Security checks
    if (
      (activeSession.ipAddress && activeSession.ipAddress !== params.ipAddress) ||
      (activeSession.deviceInfo && activeSession.deviceInfo !== params.deviceInfo)
    ) {
      logger.warn(
        { 
          userId: user._id.toString(), 
          originalIP: activeSession.ipAddress, 
          incomingIP: params.ipAddress,
          originalDevice: activeSession.deviceInfo,
          incomingDevice: params.deviceInfo
        },
        'Security breach alert: Session hijacking mismatch detected! Revoking all sessions.'
      );
      await authRepository.clearAllRefreshTokens(user._id.toString());
      throw new AuthorizationError('Security breach: IP or device fingerprint mismatch. Session revoked.');
    }

    // Generate new set of tokens
    const payload: JWTPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };

    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(payload);

    // Rotate tokens in database: remove old one, add new one
    await authRepository.removeRefreshToken(user._id.toString(), params.refreshToken);
    await authRepository.addRefreshToken(user._id.toString(), {
      token: newRefreshToken,
      deviceInfo: params.deviceInfo,
      ipAddress: params.ipAddress,
      lastUsedAt: new Date()
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  // Send Verification OTP
  async sendVerificationOtp(email: string): Promise<void> {
    const user = await authRepository.findOne({ email });
    if (!user) throw new NotFoundError('User not found');

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await authRepository.update(user._id.toString(), {
      $set: { otp, otpExpiresAt }
    });

    // Queue email sending
    await emailQueue.add('SendOtpEmail', {
      to: email,
      subject: 'Verify your AI Hospital Account',
      html: templates.otp(otp)
    });
  }

  // Verify OTP
  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const user = await authRepository.findByOtp(email, otp);
    if (!user) {
      throw new ValidationError('Invalid or expired OTP');
    }

    await authRepository.update(user._id.toString(), {
      $set: { isVerified: true, otp: null, otpExpiresAt: null }
    });

    // Queue welcome email
    await emailQueue.add('SendWelcomeEmail', {
      to: email,
      subject: 'Welcome to AI Hospital!',
      html: templates.welcome(`${user.firstName} ${user.lastName}`)
    });

    return true;
  }

  // Reset Password via OTP
  async resetPassword(email: string, otp: string, newPasswordHash: string) {
    const user = await authRepository.findByOtp(email, otp);
    if (!user) {
      throw new ValidationError('Invalid or expired OTP');
    }

    // Update password and clear sessions for security
    const updated = await authRepository.update(user._id.toString(), {
      $set: {
        passwordHash: newPasswordHash, // Will be hashed in schema hook if using Mongoose save, but model update does not trigger schema hook unless runValidators or done via document save. Let's make sure we hash it or update the document properly.
        otp: null,
        otpExpiresAt: null,
        refreshTokens: []
      }
    });

    // Wait! Mongoose findOneAndUpdate does NOT run 'save' pre hooks!
    // To ensure the password gets hashed, let's fetch the document and save it.
    const doc = await UserModel.findById(user._id);
    if (doc) {
      doc.passwordHash = newPasswordHash;
      doc.otp = null;
      doc.otpExpiresAt = null;
      doc.refreshTokens = [];
      await doc.save();
    }

    return true;
  }

  // Logout
  async logout(userId: string, token: string): Promise<void> {
    await authRepository.removeRefreshToken(userId, token);
    // Blacklist access token for safety (assuming it's passed or blacklisting is handled by client expiry, but we can store it in Redis blacklist)
    await authRepository.blacklistToken(token, 15 * 60); // 15 mins
  }

  // Logout All Devices
  async logoutAll(userId: string): Promise<void> {
    await authRepository.clearAllRefreshTokens(userId);
  }

  // Default permissions mapping
  private getDefaultPermissions(role: UserRole): string[] {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return ['*'];
      case UserRole.HOSPITAL_ADMIN:
        return ['read:all', 'write:all', 'manage:billing', 'manage:staff'];
      case UserRole.DOCTOR:
        return ['read:patients', 'write:clinical_notes', 'read:appointments', 'write:prescriptions'];
      case UserRole.RECEPTIONIST:
        return ['read:patients', 'write:patients', 'manage:appointments', 'read:billing'];
      case UserRole.LAB_TECHNICIAN:
        return ['read:patients', 'write:lab_reports'];
      case UserRole.PATIENT:
        return ['read:own_profile', 'read:own_appointments', 'read:own_medical_records'];
      default:
        return [];
    }
  }
}

export const authService = new AuthService();
export default authService;
