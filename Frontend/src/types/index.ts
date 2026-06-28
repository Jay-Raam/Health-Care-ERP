export type UserRole = 'SUPER_ADMIN' | 'HOSPITAL_ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'LAB_TECHNICIAN';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  specialty?: string;
  department?: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodType: string;
  address: string;
  allergies: string[];
  medicalHistory: {
    condition: string;
    diagnosedDate: string;
    status: 'Active' | 'Resolved';
    notes?: string;
  }[];
  documents: {
    id: string;
    name: string;
    type: string;
    uploadedAt: string;
    size: string;
  }[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  type: 'Consultation' | 'Follow-up' | 'Emergency' | 'Operation' | 'Lab Review';
  status: 'Upcoming' | 'Completed' | 'Cancelled' | 'Pending';
  notes?: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  department: string;
  availability: {
    day: string;
    slots: string[];
  }[];
  status: 'Active' | 'On Leave' | 'Busy';
  rating: number;
}

export interface LabReport {
  id: string;
  patientId: string;
  patientName: string;
  testName: string;
  category: 'Blood Work' | 'Imaging' | 'Pathology' | 'Urine Analysis' | 'Cardiology';
  uploadedAt: string;
  status: 'Pending' | 'Completed' | 'Critical';
  fileUrl?: string;
  aiSummary?: string;
  indicators: {
    name: string;
    value: string;
    referenceRange: string;
    status: 'Normal' | 'High' | 'Low';
  }[];
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  dueDate: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number; // e.g., 18 for 18% GST
  }[];
  status: 'Paid' | 'Pending' | 'Cancelled';
  paymentMethod?: 'Card' | 'Insurance' | 'Cash' | 'Bank Transfer';
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agent?: 'planner' | 'doctor' | 'billing' | 'lab' | 'appointment';
  status?: 'working' | 'completed' | 'failed';
  attachments?: {
    name: string;
    type: string;
    size: string;
  }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  pinned: boolean;
  createdAt: string;
}

export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  status: 'Inbox' | 'Sent' | 'Draft';
  attachments?: { name: string; size: string }[];
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  module: string;
  ipAddress: string;
  timestamp: string;
  status: 'Success' | 'Failed';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  module: string;
}
