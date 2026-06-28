import { doctorRepository } from './repository.js';
import { IDoctorDocument } from './schema.js';
import { NotFoundError } from '../../shared/errors/AppError.js';
import { cacheSet, cacheGet } from '../../shared/cache/redis.js';

export class DoctorService {
  async createProfile(userId: string, data: any): Promise<IDoctorDocument> {
    const existing = await doctorRepository.findByUserId(userId);
    if (existing) {
      return this.updateProfile(existing._id.toString(), data);
    }
    const profile = await doctorRepository.create({ ...data, user: userId });
    
    // Invalidate list cache
    const redis = await import('../../shared/cache/redis.js');
    await redis.cacheInvalidatePattern('doctors:*');

    return profile;
  }

  async updateProfile(doctorId: string, updateData: any): Promise<IDoctorDocument> {
    const doctor = await doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor profile not found');
    }
    const updated = await doctorRepository.update(doctorId, updateData);
    if (!updated) {
      throw new NotFoundError('Failed to update doctor profile');
    }

    // Invalidate list cache
    const redis = await import('../../shared/cache/redis.js');
    await redis.cacheInvalidatePattern('doctors:*');

    return updated;
  }

  async getProfile(doctorId: string): Promise<IDoctorDocument> {
    const doctor = await doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor profile not found');
    }
    return doctor;
  }

  async getProfileByUserId(userId: string): Promise<IDoctorDocument> {
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor profile not found for this user');
    }
    return doctor;
  }

  async listDoctors(): Promise<any[]> {
    const cacheKey = 'doctors:all';
    
    // Dashboard and list caching using Redis
    const cached = await cacheGet<any[]>(cacheKey);
    if (cached) return cached;

    const list = await doctorRepository.findActiveDoctors();
    await cacheSet(cacheKey, list, 3600); // Cache for 1 hour

    return list;
  }
}

export const doctorService = new DoctorService();
export default doctorService;
