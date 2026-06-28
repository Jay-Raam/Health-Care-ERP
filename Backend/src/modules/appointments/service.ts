import { appointmentRepository } from './repository.js';
import { IAppointmentDocument } from './schema.js';
import { AppointmentStatus } from './types.js';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError.js';
import { eventEmitter, HospitalEvents } from '../../shared/events/eventEmitter.js';
import { emitToUser } from '../../shared/socket/socketServer.js';

export class AppointmentService {
  async bookAppointment(data: {
    patientId: string;
    doctorId: string;
    appointmentDate: Date;
    startTime: string;
    endTime: string;
    reason: string;
  }): Promise<IAppointmentDocument> {
    // 1. Conflict Check: Doctor double booking
    const bookings = await appointmentRepository.findByDoctorAndDate(data.doctorId, data.appointmentDate);
    const hasConflict = bookings.some(
      (b) => b.startTime === data.startTime && b.status !== AppointmentStatus.CANCELLED
    );

    if (hasConflict) {
      throw new ConflictError('The doctor is already booked for this time slot');
    }

    // 2. Compute Queue Number
    const queueNumber = await appointmentRepository.getNextQueueNumber(data.doctorId, data.appointmentDate);

    // 3. Create Appointment
    const appointment = await appointmentRepository.create({
      ...data,
      status: AppointmentStatus.PENDING,
      queueNumber
    });

    // 4. Emit Events & Real-time Sockets
    eventEmitter.emit(HospitalEvents.APPOINTMENT_CREATED, appointment);

    // Emit live update to patient
    emitToUser(data.patientId, 'appointment_status', {
      appointmentId: appointment._id,
      status: appointment.status,
      queueNumber
    });

    return appointment;
  }

  async updateStatus(appointmentId: string, status: AppointmentStatus, clinicalNotes?: string): Promise<IAppointmentDocument> {
    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    const updated = await appointmentRepository.update(appointmentId, {
      $set: { status, clinicalNotes }
    });

    if (!updated) {
      throw new NotFoundError('Failed to update appointment');
    }

    // Notify patient
    emitToUser(updated.patient.toString(), 'appointment_status', {
      appointmentId: updated._id,
      status: updated.status
    });

    eventEmitter.emit(HospitalEvents.APPOINTMENT_UPDATED, updated);

    return updated;
  }

  async getPatientAppointments(patientId: string): Promise<IAppointmentDocument[]> {
    return appointmentRepository.findByPatient(patientId);
  }

  async getDoctorSchedule(doctorId: string, date: Date): Promise<IAppointmentDocument[]> {
    return appointmentRepository.findByDoctorAndDate(doctorId, date);
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;
