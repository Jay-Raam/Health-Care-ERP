import { appointmentService } from './service.js';
import { bookAppointmentSchema, updateAppointmentStatusSchema } from './validator.js';
import { checkAuthGraphQL, checkRoleGraphQL } from '../../shared/middleware/auth.js';
import { UserRole } from '../auth/types.js';

export const appointmentResolvers = {
  Query: {
    myAppointments: async (_parent: any, _args: any, context: any) => {
      const user = checkAuthGraphQL(context);
      return appointmentService.getPatientAppointments(user.id);
    },

    doctorSchedule: async (_parent: any, { doctorId, date }: { doctorId: string; date: string }, context: any) => {
      checkAuthGraphQL(context);
      return appointmentService.getDoctorSchedule(doctorId, new Date(date));
    }
  },

  Mutation: {
    bookAppointment: async (_parent: any, { input }: { input: any }, context: any) => {
      const user = checkRoleGraphQL(context, [UserRole.PATIENT, UserRole.RECEPTIONIST]);
      const validated = bookAppointmentSchema.parse(input);
      const appointment = await appointmentService.bookAppointment({
        patientId: user.id, // For demo, patient = user
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
    }
  }
};

export default appointmentResolvers;
