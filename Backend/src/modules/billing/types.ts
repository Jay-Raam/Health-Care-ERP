import { BaseAuditFields } from '../../shared/repositories/base.repository.js';

export enum BillStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED'
}

export interface IBillItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface IBill extends BaseAuditFields {
  _id: string;
  patient: any; // Dynamic type to support populated object or ObjectId string
  appointment?: any; // Dynamic type to support populated object or ObjectId string
  items: IBillItem[];
  totalAmount: number;
  status: BillStatus;
  pdfPath?: string;
  createdAt: Date;
  updatedAt: Date;
}
