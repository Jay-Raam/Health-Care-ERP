import { BaseAuditFields } from '../../shared/repositories/base.repository.js';

export interface IDoctorAvailability {
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string;
  endTime: string;
}

export interface IDoctor extends BaseAuditFields {
  _id: string;
  user: any; // Dynamic type to support populated object or ObjectId string
  specialty: string;
  licenseNumber: string;
  consultationFee: number;
  biography?: string;
  availability: IDoctorAvailability[];
  rating?: number;
  isAvailableToday?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
