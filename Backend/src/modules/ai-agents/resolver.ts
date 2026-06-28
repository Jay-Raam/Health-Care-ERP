import { plannerAgent } from './agents.js';
import { checkAuthGraphQL } from '../../shared/middleware/auth.js';
import { z } from 'zod';

const askAgentSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty')
});

export const aiAgentResolvers = {
  Mutation: {
    askHospitalAgent: async (_parent: any, { query }: { query: string }, context: any) => {
      const user = checkAuthGraphQL(context);
      
      const validated = askAgentSchema.parse({ query });
      
      const result = await plannerAgent.execute({
        query: validated.query,
        patientId: user.id
      });

      return {
        success: result.success,
        message: `Query resolved by ${result.agentUsed}`,
        data: {
          response: result.response
        }
      };
    }
  }
};

export default aiAgentResolvers;
