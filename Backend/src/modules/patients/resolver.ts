import { patientService } from './service.js';
import { createPatientProfileSchema, updatePatientProfileSchema } from './validator.js';
import { checkAuthGraphQL, checkRoleGraphQL } from '../../shared/middleware/auth.js';
import { UserRole } from '../auth/types.js';

export const patientResolvers = {
  Query: {
    patientProfile: async (_parent: any, { id }: { id: string }, context: any) => {
      const user = checkRoleGraphQL(context, [UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.HOSPITAL_ADMIN]);
      
      // HIPAA Audit logging of clinical record access
      context.logger.info(
        { userId: user.id, patientId: id, ipAddress: context.ipAddress },
        'HIPAA Compliance Footprint: Doctor accessed patient chart registry'
      );
      
      return patientService.getProfile(id);
    },

    myPatientProfile: async (_parent: any, _args: any, context: any) => {
      const user = checkAuthGraphQL(context);
      return patientService.getProfileByUserId(user.id);
    },

    searchPatients: async (_parent: any, { term }: { term: string }, context: any) => {
      checkRoleGraphQL(context, [UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.HOSPITAL_ADMIN]);
      return patientService.search(term);
    }
  },

  Mutation: {
    createPatientProfile: async (_parent: any, { input }: { input: any }, context: any) => {
      const user = checkAuthGraphQL(context);
      const validated = createPatientProfileSchema.parse(input);
      return patientService.createProfile(user.id, validated);
    },

    updatePatientProfile: async (_parent: any, { id, input }: { id: string; input: any }, context: any) => {
      checkRoleGraphQL(context, [UserRole.PATIENT, UserRole.RECEPTIONIST, UserRole.HOSPITAL_ADMIN]);
      const validated = updatePatientProfileSchema.parse(input);
      return patientService.updateProfile(id, validated);
    }
  }
};

export default patientResolvers;
