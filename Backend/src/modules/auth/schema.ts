import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser, UserRole } from './types.js';

export interface IUserDocument extends Omit<IUser, '_id'>, mongoose.Document {}

const UserSessionSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    deviceInfo: { type: String },
    ipAddress: { type: String },
    lastUsedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

export const UserSchema = new mongoose.Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.PATIENT
    },
    permissions: {
      type: [String],
      default: []
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    otp: {
      type: String,
      default: null
    },
    otpExpiresAt: {
      type: Date,
      default: null
    },
    refreshTokens: [UserSessionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true,
    versionKey: '__v'
  }
);

// Compound Index: search optimize
UserSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

// Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Instance method to check password
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
export default UserModel;
