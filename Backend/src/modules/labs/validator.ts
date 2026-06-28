import { z } from 'zod';

export const createLabReportSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().optional(),
  testName: z.string().min(3, 'Test name is required'),
  fileUrl: z.string().url('Invalid report URL')
});
