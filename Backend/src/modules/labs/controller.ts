import { Response, NextFunction } from 'express';
import { labReportService } from './service.js';
import { createLabReportSchema } from './validator.js';
import { AuthenticatedRequest } from '../../shared/middleware/auth.js';

export class LabReportController {
  async uploadReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createLabReportSchema.parse(req.body);
      const report = await labReportService.createReport(validated);

      res.status(201).json({
        success: true,
        message: 'Lab report uploaded. OCR queue task registered.',
        data: report,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

export const labReportController = new LabReportController();
