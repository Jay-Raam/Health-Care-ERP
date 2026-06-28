import mongoose from 'mongoose';
import { IDoctor } from './types.js';

export interface IDoctorDocument extends Omit<IDoctor, '_id'>, mongoose.Document {}

const AvailabilitySchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      required: true
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  },
  { _id: false }
);

export const DoctorSchema = new mongoose.Schema<IDoctorDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    specialty: {
      type: String,
      required: true,
      index: true
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true
    },
    consultationFee: {
      type: Number,
      required: true
    },
    biography: {
      type: String
    },
    availability: {
      type: [AvailabilitySchema],
      default: []
    },
    rating: {
      type: Number,
      default: 5.0
    },
    isAvailableToday: {
      type: Boolean,
      default: true
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

DoctorSchema.index({ specialty: 1, rating: -1 });

export const DoctorModel = mongoose.model<IDoctorDocument>('Doctor', DoctorSchema);
export default DoctorModel;
