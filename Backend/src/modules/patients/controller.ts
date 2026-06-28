import { Request, Response, NextFunction } from 'express';
import { patientService } from './service.js';
import { createPatientProfileSchema, updatePatientProfileSchema } from './validator.js';
import { AuthenticatedRequest } from '../../shared/middleware/auth.js';

export class PatientController {
  async createOwnProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      const validated = createPatientProfileSchema.parse(req.body);
      const profile = await patientService.createProfile(userId, validated);

      res.status(201).json({
        success: true,
        message: 'Patient profile created successfully',
        data: profile,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async getOwnProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const profile = await patientService.getProfileByUserId(userId);

      res.status(200).json({
        success: true,
        message: 'Patient profile retrieved successfully',
        data: profile,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

export const patientController = new PatientController();
