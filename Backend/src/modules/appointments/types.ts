import { BaseAuditFields } from '../../shared/repositories/base.repository.js';

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface IAppointment extends BaseAuditFields {
  _id: string;
  patient: any; // Dynamic type to support populated object or ObjectId string
  doctor: any;  // Dynamic type to support populated object or ObjectId string
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason: string;
  clinicalNotes?: string;
  queueNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}
