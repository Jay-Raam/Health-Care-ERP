import { authService } from './service.js';
import { config } from '../../config/index.js';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  refreshTokenSchema
} from './validator.js';

export const authResolvers = {
  Mutation: {
    register: async (_parent: any, { input }: { input: any }, context: any) => {
      const validated = registerSchema.parse(input);
      const user = await authService.register({
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        passwordHash: validated.password,
        role: validated.role
      });
      return {
        success: true,
        message: 'Registration successful. Verification OTP sent.',
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      };
    },

    login: async (_parent: any, { input }: { input: any }, context: any) => {
      const validated = loginSchema.parse(input);
      const result = await authService.login({
        email: validated.email,
        password: validated.password,
        deviceInfo: context.deviceInfo || validated.deviceInfo,
        ipAddress: context.ipAddress || validated.ipAddress
      });

      if (context.res) {
        context.res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: config.NODE_ENV === 'production',
          sameSite: config.NODE_ENV === 'production' ? 'strict' : 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/'
        });
      }

      return {
        success: true,
        message: 'Login successful',
        data: result
      };
    },

    verifyOtp: async (_parent: any, { input }: { input: any }) => {
      const validated = verifyOtpSchema.parse(input);
      await authService.verifyOtp(validated.email, validated.otp);
      return {
        success: true,
        message: 'OTP verified successfully'
      };
    },

    requestOtp: async (_parent: any, { email }: { email: string }) => {
      await authService.sendVerificationOtp(email);
      return {
        success: true,
        message: 'Verification OTP sent to email'
      };
    },

    resetPassword: async (_parent: any, { input }: { input: any }) => {
      const validated = resetPasswordSchema.parse(input);
      await authService.resetPassword(validated.email, validated.otp, validated.newPassword);
      return {
        success: true,
        message: 'Password reset successful'
      };
    },

    refreshToken: async (_parent: any, { input }: { input: any }, context: any) => {
      const validated = refreshTokenSchema.parse(input);
      
      // Try to read token from HTTP-only cookie first, fallback to GraphQL input body
      const cookieHeader = context.req?.headers?.cookie || '';
      const cookies = cookieHeader ? Object.fromEntries(
        cookieHeader.split('; ').map((c: string) => {
          const [k, ...v] = c.split('=');
          return [k, v.join('=')];
        })
      ) : {};

      const token = cookies.refreshToken || validated.refreshToken;

      const result = await authService.refresh({
        refreshToken: token,
        deviceInfo: context.deviceInfo,
        ipAddress: context.ipAddress
      });

      if (context.res) {
        context.res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: config.NODE_ENV === 'production',
          sameSite: config.NODE_ENV === 'production' ? 'strict' : 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/'
        });
      }

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: result
      };
    },

    logout: async (_parent: any, { token }: { token: string }, context: any) => {
      if (context.res) {
        context.res.clearCookie('refreshToken', {
          path: '/'
        });
      }

      if (context.user) {
        // Read token from cookie if client didn't supply it
        const cookieHeader = context.req?.headers?.cookie || '';
        const cookies = cookieHeader ? Object.fromEntries(
          cookieHeader.split('; ').map((c: string) => {
            const [k, ...v] = c.split('=');
            return [k, v.join('=')];
          })
        ) : {};
        const activeToken = cookies.refreshToken || token;
        
        await authService.logout(context.user.id, activeToken);
      }
      return {
        success: true,
        message: 'Logged out successfully'
      };
    }
  }
};
export default authResolvers;
