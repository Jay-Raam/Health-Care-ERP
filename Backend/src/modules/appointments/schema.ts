import mongoose from 'mongoose';
import { IAppointment, AppointmentStatus } from './types.js';

export interface IAppointmentDocument extends Omit<IAppointment, '_id'>, mongoose.Document {}

export const AppointmentSchema = new mongoose.Schema<IAppointmentDocument>(
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
      required: true,
      index: true
    },
    appointmentDate: {
      type: Date,
      required: true,
      index: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.PENDING,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    clinicalNotes: {
      type: String
    },
    queueNumber: {
      type: Number
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

AppointmentSchema.index({ doctor: 1, appointmentDate: 1, startTime: 1, deletedAt: 1 }, { unique: true });

export const AppointmentModel = mongoose.model<IAppointmentDocument>('Appointment', AppointmentSchema);
export default AppointmentModel;
