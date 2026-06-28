import { BaseRepository } from '../../shared/repositories/base.repository.js';
import { AppointmentModel, IAppointmentDocument } from './schema.js';

export class AppointmentRepository extends BaseRepository<IAppointmentDocument> {
  constructor() {
    super(AppointmentModel);
  }

  async findByDoctorAndDate(doctorId: string, date: Date): Promise<IAppointmentDocument[]> {
    // Reset date hours to find matching day range
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.find({
      doctor: doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay }
    });
  }

  async findByPatient(patientId: string): Promise<IAppointmentDocument[]> {
    return this.find({ patient: patientId });
  }

  async getNextQueueNumber(doctorId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const count = await this.model.countDocuments({
      doctor: doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      deletedAt: null
    });
    return count + 1;
  }
}

export const appointmentRepository = new AppointmentRepository();
