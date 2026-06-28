import { z } from 'zod';

export const createPatientProfileSchema = z.object({
  dateOfBirth: z.string().transform((str) => new Date(str)),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  address: z.string().min(5, 'Address is too short'),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medicalHistory: z.array(z.string()).optional(),
  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string()
  }).optional()
});

export const updatePatientProfileSchema = createPatientProfileSchema.partial();
