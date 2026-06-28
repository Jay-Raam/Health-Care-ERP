import { z } from 'zod';

const AvailabilityDaySchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
});

export const createDoctorProfileSchema = z.object({
  specialty: z.string().min(2, 'Specialty is too short'),
  licenseNumber: z.string().min(5, 'License number is too short'),
  consultationFee: z.number().positive('Consultation fee must be positive'),
  biography: z.string().optional(),
  availability: z.array(AvailabilityDaySchema).default([])
});

export const updateDoctorProfileSchema = createDoctorProfileSchema.partial();
