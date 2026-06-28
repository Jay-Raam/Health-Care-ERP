import { BaseRepository } from '../../shared/repositories/base.repository.js';
import { UserModel, IUserDocument } from './schema.js';
import { UserSession } from './types.js';

export class AuthRepository extends BaseRepository<IUserDocument> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return this.findOne({ email });
  }

  async findByOtp(email: string, otp: string): Promise<IUserDocument | null> {
    return this.findOne({
      email,
      otp,
      otpExpiresAt: { $gt: new Date() }
    });
  }

  async addRefreshToken(userId: string, session: UserSession): Promise<IUserDocument | null> {
    return this.model.findOneAndUpdate(
      { _id: userId, deletedAt: null },
      { $push: { refreshTokens: session } },
      { new: true, lean: true }
    ) as any;
  }

  async removeRefreshToken(userId: string, token: string): Promise<IUserDocument | null> {
    return this.model.findOneAndUpdate(
      { _id: userId },
      { $pull: { refreshTokens: { token } } },
      { new: true, lean: true }
    ) as any;
  }

  async clearAllRefreshTokens(userId: string): Promise<IUserDocument | null> {
    return this.model.findOneAndUpdate(
      { _id: userId },
      { $set: { refreshTokens: [] } },
      { new: true, lean: true }
    ) as any;
  }

  // Token blacklist logic (Redis check wrapper)
  async blacklistToken(token: string, expiresAtSeconds: number): Promise<void> {
    const redis = await import('../../shared/cache/redis.js');
    await redis.cacheSet(`bl:${token}`, '1', expiresAtSeconds);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const redis = await import('../../shared/cache/redis.js');
    const blacklisted = await redis.cacheGet(`bl:${token}`);
    return !!blacklisted;
  }
}

export const authRepository = new AuthRepository();
