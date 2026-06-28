import mongoose from 'mongoose';
import { IBill, BillStatus } from './types.js';

export interface IBillDocument extends Omit<IBill, '_id'>, mongoose.Document {}

const BillItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true }
  },
  { _id: false }
);

export const BillSchema = new mongoose.Schema<IBillDocument>(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true
    },
    items: {
      type: [BillItemSchema],
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(BillStatus),
      default: BillStatus.PENDING,
      required: true,
      index: true
    },
    pdfPath: {
      type: String
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

BillSchema.index({ status: 1, totalAmount: -1 });

export const BillModel = mongoose.model<IBillDocument>('Bill', BillSchema);
export default BillModel;
