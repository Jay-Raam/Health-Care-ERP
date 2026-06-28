import { labReportService } from './service.js';
import { createLabReportSchema } from './validator.js';
import { checkAuthGraphQL, checkRoleGraphQL } from '../../shared/middleware/auth.js';
import { UserRole } from '../auth/types.js';

export const labReportResolvers = {
  Query: {
    myLabReports: async (_parent: any, _args: any, context: any) => {
      const user = checkAuthGraphQL(context);
      return labReportService.getPatientReports(user.id);
    }
  },

  Mutation: {
    uploadLabReport: async (_parent: any, { input }: { input: any }, context: any) => {
      checkRoleGraphQL(context, [UserRole.LAB_TECHNICIAN, UserRole.DOCTOR]);
      const validated = createLabReportSchema.parse(input);
      return labReportService.createReport(validated);
    }
  }
};

export default labReportResolvers;
