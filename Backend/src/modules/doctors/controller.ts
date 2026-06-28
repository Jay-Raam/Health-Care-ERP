import { Response, NextFunction } from 'express';
import { doctorService } from './service.js';
import { createDoctorProfileSchema } from './validator.js';
import { AuthenticatedRequest } from '../../shared/middleware/auth.js';

export class DoctorController {
  async getOwnProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const profile = await doctorService.getProfileByUserId(userId);

      res.status(200).json({
        success: true,
        message: 'Doctor profile retrieved successfully',
        data: profile,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async listDoctors(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await doctorService.listDoctors();
      res.status(200).json({
        success: true,
        message: 'Doctors listed successfully',
        data: list,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

export const doctorController = new DoctorController();
