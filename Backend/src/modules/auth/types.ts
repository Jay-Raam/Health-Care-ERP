export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  HOSPITAL_ADMIN = 'HOSPITAL_ADMIN',
  DOCTOR = 'DOCTOR',
  RECEPTIONIST = 'RECEPTIONIST',
  PATIENT = 'PATIENT',
  LAB_TECHNICIAN = 'LAB_TECHNICIAN'
}

export interface UserSession {
  token: string;
  deviceInfo?: string;
  ipAddress?: string;
  lastUsedAt: Date;
}

export interface IUser {
  _id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: string[];
  isVerified: boolean;
  otp?: string | null;
  otpExpiresAt?: Date | null;
  refreshTokens: UserSession[];
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date | null;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  permissions: string[];
}
