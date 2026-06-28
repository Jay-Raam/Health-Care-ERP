import { billService } from './service.js';
import { createBillSchema } from './validator.js';
import { checkAuthGraphQL, checkRoleGraphQL } from '../../shared/middleware/auth.js';
import { UserRole } from '../auth/types.js';

export const billResolvers = {
  Query: {
    myBills: async (_parent: any, _args: any, context: any) => {
      const user = checkAuthGraphQL(context);
      return billService.listPatientBills(user.id);
    }
  },

  Mutation: {
    createBill: async (_parent: any, { input }: { input: any }, context: any) => {
      checkRoleGraphQL(context, [UserRole.HOSPITAL_ADMIN, UserRole.RECEPTIONIST]);
      const validated = createBillSchema.parse(input);
      return billService.createBill(validated);
    },

    payBill: async (_parent: any, { id }: { id: string }, context: any) => {
      checkRoleGraphQL(context, [UserRole.PATIENT, UserRole.RECEPTIONIST]);
      const bill = await billService.payBill(id);
      context.pubSub.publish('BILL_SETTLED', bill);
      return bill;
    }
  }
};

export default billResolvers;
