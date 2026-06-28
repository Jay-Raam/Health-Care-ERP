import mongoose from 'mongoose';
import { ILabReport, LabReportStatus } from './types.js';

export interface ILabReportDocument extends Omit<ILabReport, '_id'>, mongoose.Document {}

export const LabReportSchema = new mongoose.Schema<ILabReportDocument>(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      index: true
    },
    testName: {
      type: String,
      required: true,
      index: true
    },
    resultSummary: {
      type: String
    },
    ocrResult: {
      type: mongoose.Schema.Types.Mixed
    },
    status: {
      type: String,
      enum: Object.values(LabReportStatus),
      default: LabReportStatus.PENDING,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
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

export const LabReportModel = mongoose.model<ILabReportDocument>('LabReport', LabReportSchema);
export default LabReportModel;
