import { doctorService } from './service.js';
import { createDoctorProfileSchema, updateDoctorProfileSchema } from './validator.js';
import { checkAuthGraphQL, checkRoleGraphQL } from '../../shared/middleware/auth.js';
import { UserRole } from '../auth/types.js';

export const doctorResolvers = {
  Query: {
    doctorsList: async (_parent: any, _args: any, context: any) => {
      // Patients, Receptionists, Doctors, Admins can view doctors
      checkAuthGraphQL(context);
      return doctorService.listDoctors();
    },

    doctorProfile: async (_parent: any, { id }: { id: string }, context: any) => {
      checkAuthGraphQL(context);
      return doctorService.getProfile(id);
    }
  },

  Mutation: {
    createDoctorProfile: async (_parent: any, { input }: { input: any }, context: any) => {
      const user = checkRoleGraphQL(context, [UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN]);
      const validated = createDoctorProfileSchema.parse(input);
      return doctorService.createProfile(user.id, validated);
    },

    updateDoctorProfile: async (_parent: any, { id, input }: { id: string; input: any }, context: any) => {
      checkRoleGraphQL(context, [UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN]);
      const validated = updateDoctorProfileSchema.parse(input);
      return doctorService.updateProfile(id, validated);
    }
  }
};

export default doctorResolvers;
