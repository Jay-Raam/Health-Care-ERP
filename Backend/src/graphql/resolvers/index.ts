import { authResolvers } from '../../modules/auth/resolver.js';
import { patientResolvers } from '../../modules/patients/resolver.js';
import { doctorResolvers } from '../../modules/doctors/resolver.js';
import { appointmentResolvers } from '../../modules/appointments/resolver.js';
import { billResolvers } from '../../modules/billing/resolver.js';
import { labReportResolvers } from '../../modules/labs/resolver.js';
import { aiAgentResolvers } from '../../modules/ai-agents/resolver.js';

export const resolvers = {
  Query: {
    ...patientResolvers.Query,
    ...doctorResolvers.Query,
    ...appointmentResolvers.Query,
    ...billResolvers.Query,
    ...labReportResolvers.Query
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...patientResolvers.Mutation,
    ...doctorResolvers.Mutation,
    ...appointmentResolvers.Mutation,
    ...billResolvers.Mutation,
    ...labReportResolvers.Mutation,
    ...aiAgentResolvers.Mutation
  },

  // Field-level resolvers for relations (DataLoaders batching)
  User: {
    id: (parent: any) => parent.id || parent._id?.toString()
  },

  Patient: {
    id: (parent: any) => parent.id || parent._id?.toString(),
    user: async (parent: any, _args: any, context: any) => {
      if (!parent.user) return null;
      if (typeof parent.user === 'object' && (parent.user.id || parent.user._id)) {
        return parent.user;
      }
      return context.loaders.user.load(parent.user.toString());
    }
  },

  Doctor: {
    id: (parent: any) => parent.id || parent._id?.toString(),
    user: async (parent: any, _args: any, context: any) => {
      if (!parent.user) return null;
      if (typeof parent.user === 'object' && (parent.user.id || parent.user._id)) {
        return parent.user;
      }
      return context.loaders.user.load(parent.user.toString());
    }
  },

  Appointment: {
    patient: async (parent: any, _args: any, context: any) => {
      if (!parent.patient) return null;
      return context.loaders.patient.load(parent.patient.toString());
    },
    doctor: async (parent: any, _args: any, context: any) => {
      if (!parent.doctor) return null;
      return context.loaders.doctor.load(parent.doctor.toString());
    }
  },

  Bill: {
    patient: async (parent: any, _args: any, context: any) => {
      if (!parent.patient) return null;
      return context.loaders.patient.load(parent.patient.toString());
    },
    appointment: async (parent: any, _args: any, context: any) => {
      if (!parent.appointment) return null;
      return context.loaders.appointment.load(parent.appointment.toString());
    }
  },

  LabReport: {
    patient: async (parent: any, _args: any, context: any) => {
      if (!parent.patient) return null;
      return context.loaders.patient.load(parent.patient.toString());
    },
    doctor: async (parent: any, _args: any, context: any) => {
      if (!parent.doctor) return null;
      return context.loaders.doctor.load(parent.doctor.toString());
    },
    ocrResult: (parent: any) => {
      if (!parent.ocrResult) return null;
      return typeof parent.ocrResult === 'string'
        ? parent.ocrResult
        : JSON.stringify(parent.ocrResult);
    }
  },

  Subscription: {
    appointmentBooked: {
      subscribe: (_parent: any, _args: any, context: any) => context.pubSub.subscribe('APPOINTMENT_BOOKED')
    },
    billSettled: {
      subscribe: (_parent: any, _args: any, context: any) => context.pubSub.subscribe('BILL_SETTLED')
    }
  }
};

export default resolvers;
