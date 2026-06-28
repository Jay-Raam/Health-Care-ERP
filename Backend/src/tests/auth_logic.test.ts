import { AuthService } from '../modules/auth/service.js';
import { authRepository } from '../modules/auth/repository.js';
import { UserRole } from '../modules/auth/types.js';
import { AuthenticationError, AuthorizationError } from '../shared/errors/AppError.js';

// Mock dependencies
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockImplementation((token, secret) => {
    if (token === 'expired-refresh-token') {
      throw new Error('jwt expired');
    }
    if (token === 'stolen-refresh-token' || token === 'old-rotated-token') {
      return { id: '507f1f77bcf86cd799439011' };
    }
    return {
      id: '507f1f77bcf86cd799439011',
      email: 'doctor@hospitalagent.ai',
      role: 'SUPER_ADMIN',
      permissions: ['*']
    };
  }),
  sign: jest.fn().mockImplementation((payload, secret, options) => {
    if (options && options.expiresIn === '15m') {
      return 'new-access-token';
    }
    return 'new-rotated-refresh-token';
  })
}));

jest.mock('../shared/cache/redis', () => {
  const store = new Map<string, string>();
  return {
    cacheSet: jest.fn().mockImplementation((key, value) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    cacheGet: jest.fn().mockImplementation((key) => {
      return Promise.resolve(store.get(key) || null);
    })
  };
});

jest.mock('../shared/queue/bullmq', () => ({
  emailQueue: {
    add: jest.fn().mockResolvedValue({})
  }
}));

describe('Auth Service - Login, Logout & Token Rotation', () => {
  let authService: AuthService;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();

    // Reset mock user state for each test
    mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'doctor@hospitalagent.ai',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.SUPER_ADMIN,
      permissions: ['*'],
      isVerified: true,
      comparePassword: jest.fn().mockResolvedValue(true),
      refreshTokens: [
        { token: 'valid-refresh-token', lastUsedAt: new Date() },
        { token: 'old-rotated-token', lastUsedAt: new Date() }
      ]
    };

    // Setup repository mocks
    jest.spyOn(authRepository, 'findOne').mockResolvedValue(mockUser as any);
    jest.spyOn(authRepository, 'findById').mockResolvedValue(mockUser as any);
    jest.spyOn(authRepository, 'addRefreshToken').mockResolvedValue(mockUser as any);
    jest.spyOn(authRepository, 'removeRefreshToken').mockImplementation(async (userId, token) => {
      mockUser.refreshTokens = mockUser.refreshTokens.filter((t: any) => t.token !== token);
      return mockUser as any;
    });
    jest.spyOn(authRepository, 'clearAllRefreshTokens').mockImplementation(async (userId) => {
      mockUser.refreshTokens = [];
      return mockUser as any;
    });
    jest.spyOn(authRepository, 'blacklistToken').mockResolvedValue(undefined);
  });

  describe('1. Login Flow', () => {
    it('should successfully authenticate user and save the refresh token session', async () => {
      const result = await authService.login({
        email: 'doctor@hospitalagent.ai',
        password: 'Password123!',
        deviceInfo: 'Mozilla/Chrome',
        ipAddress: '127.0.0.1'
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('doctor@hospitalagent.ai');
      expect(authRepository.addRefreshToken).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({
          token: expect.any(String),
          deviceInfo: 'Mozilla/Chrome',
          ipAddress: '127.0.0.1'
        })
      );
    });

    it('should throw AuthenticationError if credentials do not match', async () => {
      mockUser.comparePassword.mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'doctor@hospitalagent.ai',
          password: 'wrong-password'
        })
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('2. Refresh Token Rotation (RTR)', () => {
    it('should rotate valid refresh tokens and return new pairs', async () => {
      const result = await authService.refresh({
        refreshToken: 'valid-refresh-token',
        deviceInfo: 'Mobile Client',
        ipAddress: '10.0.0.1'
      });

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-rotated-refresh-token'
      });

      // Assert old token was deleted
      expect(authRepository.removeRefreshToken).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'valid-refresh-token'
      );

      // Assert new token was saved
      expect(authRepository.addRefreshToken).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({
          token: 'new-rotated-refresh-token',
          deviceInfo: 'Mobile Client'
        })
      );
    });

    it('should throw AuthenticationError if refresh token has expired', async () => {
      await expect(
        authService.refresh({
          refreshToken: 'expired-refresh-token'
        })
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('3. Token Theft & Reuse Detection', () => {
    it('should revoke ALL active sessions if an already rotated token is re-submitted', async () => {
      // Let's submit 'stolen-refresh-token' which is NOT in mockUser.refreshTokens.
      // In RTR, a token not present in active sessions means it was already used and rotated (or stolen).
      await expect(
        authService.refresh({
          refreshToken: 'stolen-refresh-token'
        })
      ).rejects.toThrow(AuthorizationError);

      // Verify all sessions were purged for security
      expect(authRepository.clearAllRefreshTokens).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockUser.refreshTokens).toHaveLength(0);
    });
  });

  describe('4. Logout Flow', () => {
    it('should remove refresh token session and blacklist the access token in Redis', async () => {
      await authService.logout('507f1f77bcf86cd799439011', 'valid-refresh-token');

      // Assert refresh token was removed
      expect(authRepository.removeRefreshToken).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'valid-refresh-token'
      );

      // Assert access token was blacklisted
      expect(authRepository.blacklistToken).toHaveBeenCalledWith('valid-refresh-token', 900); // 15 mins
    });
  });

  describe('5. Logout All Devices Flow', () => {
    it('should remove all sessions from the database', async () => {
      await authService.logoutAll('507f1f77bcf86cd799439011');

      expect(authRepository.clearAllRefreshTokens).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockUser.refreshTokens).toHaveLength(0);
    });
  });
});
