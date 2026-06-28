import { BaseAuditFields } from '../../shared/repositories/base.repository.js';

export enum LabReportStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED'
}

export interface ILabReport extends BaseAuditFields {
  _id: string;
  patient: any; // Dynamic type to support populated object or ObjectId string
  doctor?: any; // Dynamic type to support populated object or ObjectId string
  testName: string;
  resultSummary?: string;
  ocrResult?: Record<string, any>;
  status: LabReportStatus;
  fileUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
