import { BaseAuditFields } from '../../shared/repositories/base.repository.js';

export interface IPatient extends BaseAuditFields {
  _id: string;
  user: any; // Dynamic type to support populated object or ObjectId string
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  address: string;
  bloodType?: string;
  allergies?: string[];
  medicalHistory?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
