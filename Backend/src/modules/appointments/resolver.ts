import { appointmentService } from './service.js';
import { bookAppointmentSchema, updateAppointmentStatusSchema } from './validator.js';
import { checkAuthGraphQL, checkRoleGraphQL } from '../../shared/middleware/auth.js';
import { UserRole } from '../auth/types.js';
import { patientRepository } from '../patients/repository.js';
import { doctorRepository } from '../doctors/repository.js';
import { appointmentRepository } from './repository.js';
import { patientService } from '../patients/service.js';

export const appointmentResolvers = {
  Query: {
    myAppointments: async (_parent: any, _args: any, context: any) => {
      const user = checkAuthGraphQL(context);
      
      if (user.role === UserRole.PATIENT) {
        const patient = await patientRepository.findByUserId(user.id);
        if (!patient) return [];
        return appointmentService.getPatientAppointments(patient._id.toString());
      } else if (user.role === UserRole.DOCTOR) {
        const doctor = await doctorRepository.findByUserId(user.id);
        if (!doctor) return [];
        return appointmentRepository.find({ doctor: doctor._id.toString() });
      } else {
        // Receptionist, Admins can view all appointments
        return appointmentRepository.find({});
      }
    },

    doctorSchedule: async (_parent: any, { doctorId, date }: { doctorId: string; date: string }, context: any) => {
      checkAuthGraphQL(context);
      return appointmentService.getDoctorSchedule(doctorId, new Date(date));
    }
  },

  Mutation: {
    bookAppointment: async (_parent: any, { input }: { input: any }, context: any) => {
      const user = checkRoleGraphQL(context, [
        UserRole.PATIENT,
        UserRole.RECEPTIONIST,
        UserRole.HOSPITAL_ADMIN,
        UserRole.SUPER_ADMIN
      ]);
      const validated = bookAppointmentSchema.parse(input);
      
      let finalPatientId: string;
      
      if (user.role !== UserRole.PATIENT && validated.patientId) {
        // Receptionist or admin booking on behalf of a patient
        let patient = await patientRepository.findById(validated.patientId);
        if (!patient) {
          patient = await patientRepository.findByUserId(validated.patientId);
        }
        if (!patient) {
          throw new Error('Patient profile not found for the given ID');
        }
        finalPatientId = patient._id.toString();
      } else {
        // Patient booking for themselves
        let patient = await patientRepository.findByUserId(user.id);
        if (!patient) {
          patient = await patientService.createProfile(user.id, {
            dateOfBirth: new Date('1990-01-01'),
            gender: 'MALE',
            phone: '555-555-5555',
            address: 'Created on booking'
          });
        }
        finalPatientId = patient._id.toString();
      }

      const appointment = await appointmentService.bookAppointment({
        patientId: finalPatientId,
        doctorId: validated.doctorId,
        appointmentDate: validated.appointmentDate,
        startTime: validated.startTime,
        endTime: validated.endTime,
        reason: validated.reason
      });
      context.pubSub.publish('APPOINTMENT_BOOKED', appointment);
      return appointment;
    },

    updateAppointmentStatus: async (
      _parent: any,
      { id, status, clinicalNotes }: { id: string; status: any; clinicalNotes?: string },
      context: any
    ) => {
      checkRoleGraphQL(context, [UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.HOSPITAL_ADMIN]);
      const validated = updateAppointmentStatusSchema.parse({ status, clinicalNotes });
      return appointmentService.updateStatus(id, validated.status, validated.clinicalNotes);
    },

    rescheduleAppointment: async (
      _parent: any,
      { id, date, startTime, endTime }: { id: string; date: string; startTime: string; endTime: string },
      context: any
    ) => {
      checkRoleGraphQL(context, [UserRole.PATIENT, UserRole.RECEPTIONIST, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]);
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime) || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)) {
        throw new Error('Times must be in HH:MM format');
      }
      return appointmentService.rescheduleAppointment(id, new Date(date), startTime, endTime);
    }
  }
};

export default appointmentResolvers;
