import mongoose from 'mongoose';
import { IPatient } from './types.js';

export interface IPatientDocument extends Omit<IPatient, '_id'>, mongoose.Document {}

export const PatientSchema = new mongoose.Schema<IPatientDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    bloodType: {
      type: String
    },
    allergies: {
      type: [String],
      default: []
    },
    medicalHistory: {
      type: [String],
      default: []
    },
    emergencyContact: {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String }
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

PatientSchema.index({ phone: 1 });
PatientSchema.index({ bloodType: 1, gender: 1 });

export const PatientModel = mongoose.model<IPatientDocument>('Patient', PatientSchema);
export default PatientModel;
