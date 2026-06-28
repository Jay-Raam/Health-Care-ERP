import { Response, NextFunction } from 'express';
import { appointmentService } from './service.js';
import { bookAppointmentSchema } from './validator.js';
import { AuthenticatedRequest } from '../../shared/middleware/auth.js';

export class AppointmentController {
  async bookAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id; // In production, we find Patient ID associated with User ID
      if (!patientId) throw new Error('User not authenticated');

      const validated = bookAppointmentSchema.parse(req.body);
      const appointment = await appointmentService.bookAppointment({
        patientId, // Stub mapping User -> Patient
        doctorId: validated.doctorId,
        appointmentDate: validated.appointmentDate,
        startTime: validated.startTime,
        endTime: validated.endTime,
        reason: validated.reason
      });

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        data: appointment,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

export const appointmentController = new AppointmentController();
