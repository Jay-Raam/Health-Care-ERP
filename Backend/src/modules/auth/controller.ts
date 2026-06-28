import { Request, Response, NextFunction } from 'express';
import { authService } from './service.js';
import { loginSchema, registerSchema, verifyOtpSchema } from './validator.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = registerSchema.parse(req.body);
      const user = await authService.register({
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        passwordHash: validated.password,
        role: validated.role
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful. Verification OTP sent to email.',
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await authService.login({
        email: validated.email,
        password: validated.password,
        deviceInfo: req.headers['user-agent'] || validated.deviceInfo,
        ipAddress: req.ip || validated.ipAddress
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = verifyOtpSchema.parse(req.body);
      await authService.verifyOtp(validated.email, validated.otp);
      
      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        data: null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
