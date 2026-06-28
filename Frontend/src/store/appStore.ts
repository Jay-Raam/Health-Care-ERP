import { create } from 'zustand';
import { 
  Patient, Appointment, Doctor, LabReport, Invoice, 
  ChatSession, ChatMessage, Email, NotificationItem, AuditLog, UserProfile, UserRole 
} from '../types';

interface AppState {
  // Auth State
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  login: (user: UserProfile) => void;
  restoreSession: (user: UserProfile) => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;

  // Theme State
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // General States
  pins: string[]; // List of page/module names pinned
  togglePin: (moduleName: string) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isTabLoading: boolean;
  setIsTabLoading: (loading: boolean) => void;

  // Patients Module
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  updatePatient: (id: string, updated: Partial<Patient>) => void;
  deletePatient: (id: string) => void;

  // Appointments Module
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, updated: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;

  // Doctors Module
  doctors: Doctor[];
  updateDoctor: (id: string, updated: Partial<Doctor>) => void;

  // Lab Reports Module
  labReports: LabReport[];
  addLabReport: (report: Omit<LabReport, 'id' | 'uploadedAt'>) => void;
  updateLabReport: (id: string, updated: Partial<LabReport>) => void;
  deleteLabReport: (id: string) => void;

  // Billing Module
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'date'>) => void;
  updateInvoice: (id: string, updated: Partial<Invoice>) => void;

  // AI Chat Panel
  chatSessions: ChatSession[];
  activeSessionId: string | null;
  addChatSession: () => string;
  deleteChatSession: (id: string) => void;
  renameChatSession: (id: string, title: string) => void;
  togglePinChat: (id: string) => void;
  addMessageToSession: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateLastMessageStatus: (sessionId: string, status: 'working' | 'completed' | 'failed', content?: string) => void;

  // Email Panel
  emails: Email[];
  sendEmail: (email: Omit<Email, 'id' | 'timestamp' | 'status'>) => void;
  saveDraftEmail: (email: Omit<Email, 'id' | 'timestamp' | 'status'>) => string;
  deleteEmail: (id: string) => void;

  // Notifications
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;

  // Admin Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (action: string, module: string, status: 'Success' | 'Failed') => void;
  
  // Active Navigation Target (Custom Router Fallback/State)
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AUTH_STORAGE_KEY = 'app-auth-user';

export const loadStoredAuthUser = (): UserProfile | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as UserProfile;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

const persistAuthUser = (user: UserProfile | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

// PREMIUM INITIAL MOCK DATA
const initialDoctors: Doctor[] = [
  {
    id: 'DOC-101',
    name: 'Dr. Sarah Connor',
    email: 'sarah.connor@hospital.com',
    phone: '+1 (555) 019-2834',
    specialization: 'Cardiologist',
    department: 'Cardiology',
    availability: [
      { day: 'Monday', slots: ['09:00 AM', '10:30 AM', '02:00 PM', '04:00 PM'] },
      { day: 'Wednesday', slots: ['09:00 AM', '11:00 AM', '03:00 PM'] },
      { day: 'Friday', slots: ['10:00 AM', '01:30 PM', '04:30 PM'] }
    ],
    status: 'Active',
    rating: 4.9
  },
  {
    id: 'DOC-102',
    name: 'Dr. David Marcus',
    email: 'david.marcus@hospital.com',
    phone: '+1 (555) 018-9922',
    specialization: 'Neurologist',
    department: 'Neurology',
    availability: [
      { day: 'Tuesday', slots: ['10:00 AM', '11:30 AM', '01:00 PM', '03:30 PM'] },
      { day: 'Thursday', slots: ['09:00 AM', '10:30 AM', '02:00 PM', '05:00 PM'] }
    ],
    status: 'Active',
    rating: 4.8
  },
  {
    id: 'DOC-103',
    name: 'Dr. Helen Cho',
    email: 'helen.cho@hospital.com',
    phone: '+1 (555) 017-4839',
    specialization: 'Hematologist & Diagnostics',
    department: 'Lab & Diagnostics',
    availability: [
      { day: 'Monday', slots: ['08:00 AM', '09:30 AM', '11:00 AM'] },
      { day: 'Tuesday', slots: ['02:00 PM', '03:30 PM', '05:00 PM'] },
      { day: 'Thursday', slots: ['08:00 AM', '10:00 AM', '01:00 PM'] }
    ],
    status: 'Busy',
    rating: 4.95
  },
  {
    id: 'DOC-104',
    name: 'Dr. Robert Carter',
    email: 'robert.carter@hospital.com',
    phone: '+1 (555) 014-2288',
    specialization: 'Emergency Physician',
    department: 'Emergency Medicine',
    availability: [
      { day: 'Friday', slots: ['08:00 PM', '10:00 PM', '11:30 PM'] },
      { day: 'Saturday', slots: ['12:00 PM', '04:00 PM', '08:00 PM'] }
    ],
    status: 'On Leave',
    rating: 4.7
  }
];

const initialPatients: Patient[] = [
  {
    id: 'PAT-8801',
    name: 'Alexander Sterling',
    email: 'alexander.sterling@gmail.com',
    phone: '+1 (555) 123-4567',
    dob: '1984-04-12',
    gender: 'Male',
    bloodType: 'A+',
    address: '1024 Emerald Bay Drive, San Francisco, CA',
    allergies: ['Penicillin', 'Peanuts'],
    medicalHistory: [
      { condition: 'Hypertension', diagnosedDate: '2021-02-18', status: 'Active', notes: 'Managed with Lisinopril 10mg daily' },
      { condition: 'Acute Appendicitis', diagnosedDate: '2018-09-05', status: 'Resolved', notes: 'Appendectomy completed without complications' }
    ],
    documents: [
      { id: 'DOCX-01', name: 'EKG_Report_Feb2026.pdf', type: 'PDF', uploadedAt: '2026-02-15 10:30 AM', size: '2.4 MB' },
      { id: 'DOCX-02', name: 'Chest_XRay_Digital.png', type: 'Image', uploadedAt: '2025-11-04 03:12 PM', size: '14.2 MB' }
    ]
  },
  {
    id: 'PAT-4212',
    name: 'Evelyn Montgomery',
    email: 'evelyn.mont@yahoo.com',
    phone: '+1 (555) 987-6543',
    dob: '1992-08-27',
    gender: 'Female',
    bloodType: 'O-',
    address: '445 Oakwood Ridge Apt 3B, Boston, MA',
    allergies: ['Sulfa Drugs', 'Bees'],
    medicalHistory: [
      { condition: 'Mild Asthma', diagnosedDate: '2023-05-12', status: 'Active', notes: 'Albuterol inhaler prescribed for physical exertion' }
    ],
    documents: [
      { id: 'DOCX-03', name: 'BloodPanel_Complete_June2026.pdf', type: 'PDF', uploadedAt: '2026-06-20 09:15 AM', size: '1.8 MB' }
    ]
  },
  {
    id: 'PAT-3011',
    name: 'Marcus Vance',
    email: 'marcus.vance@outlook.com',
    phone: '+1 (555) 456-7890',
    dob: '1970-11-30',
    gender: 'Male',
    bloodType: 'B+',
    address: '89 Beacon Street, Seattle, WA',
    allergies: ['None'],
    medicalHistory: [
      { condition: 'Type 2 Diabetes', diagnosedDate: '2020-10-14', status: 'Active', notes: 'Dietary management + Metformin 500mg twice daily' }
    ],
    documents: [
      { id: 'DOCX-04', name: 'HbA1c_TrendLine.pdf', type: 'PDF', uploadedAt: '2026-05-18 11:00 AM', size: '820 KB' }
    ]
  }
];

const initialAppointments: Appointment[] = [
  {
    id: 'APT-1001',
    patientId: 'PAT-8801',
    patientName: 'Alexander Sterling',
    doctorId: 'DOC-101',
    doctorName: 'Dr. Sarah Connor',
    date: '2026-06-27',
    time: '09:00 AM',
    type: 'Consultation',
    status: 'Upcoming',
    notes: 'Routine cardiovascular fitness checkup. Check EKG trends.'
  },
  {
    id: 'APT-1002',
    patientId: 'PAT-4212',
    patientName: 'Evelyn Montgomery',
    doctorId: 'DOC-103',
    doctorName: 'Dr. Helen Cho',
    date: '2026-06-27',
    time: '02:00 PM',
    type: 'Lab Review',
    status: 'Pending',
    notes: 'Review complete blood count parameters and iron profile results.'
  },
  {
    id: 'APT-1003',
    patientId: 'PAT-3011',
    patientName: 'Marcus Vance',
    doctorId: 'DOC-102',
    doctorName: 'Dr. David Marcus',
    date: '2026-06-28',
    time: '10:30 AM',
    type: 'Follow-up',
    status: 'Upcoming',
    notes: 'Bi-annual diabetic neuropathy and reflex diagnostics assessment.'
  },
  {
    id: 'APT-1004',
    patientId: 'PAT-8801',
    patientName: 'Alexander Sterling',
    doctorId: 'DOC-103',
    doctorName: 'Dr. Helen Cho',
    date: '2026-06-20',
    time: '11:00 AM',
    type: 'Consultation',
    status: 'Completed',
    notes: 'Urgent consult regarding persistent chest fatigue. Referral given for stress test.'
  }
];

const initialLabReports: LabReport[] = [
  {
    id: 'LAB-201',
    patientId: 'PAT-4212',
    patientName: 'Evelyn Montgomery',
    testName: 'Complete Blood Count (CBC) & Iron Panel',
    category: 'Blood Work',
    uploadedAt: '2026-06-20 09:15 AM',
    status: 'Completed',
    fileUrl: '#',
    aiSummary: 'The panel reveals mild iron-deficiency anemia indicated by slightly decreased hemoglobin and hematocrit values. Red blood cell indicators suggest minor microcytosis. Platelet counts and total white blood cell counts remain well within clinical reference limits. Suggest dietary modification or iron sulfate supplementation.',
    indicators: [
      { name: 'Hemoglobin', value: '11.4 g/dL', referenceRange: '12.0 - 15.5 g/dL', status: 'Low' },
      { name: 'Hematocrit', value: '34.2 %', referenceRange: '37.0 - 48.0 %', status: 'Low' },
      { name: 'Red Blood Cells (RBC)', value: '3.9 M/µL', referenceRange: '4.0 - 5.2 M/µL', status: 'Low' },
      { name: 'White Blood Cells (WBC)', value: '6.5 K/µL', referenceRange: '4.5 - 11.0 K/µL', status: 'Normal' },
      { name: 'Ferritin', value: '12 ng/mL', referenceRange: '15 - 150 ng/mL', status: 'Low' }
    ]
  },
  {
    id: 'LAB-202',
    patientId: 'PAT-8801',
    patientName: 'Alexander Sterling',
    testName: 'Comprehensive Cardiovascular EKG Analysis',
    category: 'Cardiology',
    uploadedAt: '2026-02-15 10:30 AM',
    status: 'Completed',
    fileUrl: '#',
    aiSummary: 'Resting EKG demonstrates sinus rhythm at 68 bpm. No abnormal ST-segment elevations or depressions detected, ruling out active ischemia. Pr-interval is normal. Occasional isolated unifocal premature ventricular contractions (PVCs) recorded, but clinically insignificant at current density.',
    indicators: [
      { name: 'Heart Rate', value: '68 bpm', referenceRange: '60 - 100 bpm', status: 'Normal' },
      { name: 'PR Interval', value: '162 ms', referenceRange: '120 - 200 ms', status: 'Normal' },
      { name: 'QTc Interval', value: '412 ms', referenceRange: '350 - 450 ms', status: 'Normal' }
    ]
  }
];

const initialInvoices: Invoice[] = [
  {
    id: 'INV-3011',
    patientId: 'PAT-8801',
    patientName: 'Alexander Sterling',
    date: '2026-06-20',
    dueDate: '2026-07-20',
    items: [
      { description: 'Specialist Cardiovascular Consultation Fee', quantity: 1, unitPrice: 220.00, taxRate: 18 },
      { description: 'Diagnostic Resting 12-Lead Electrocardiogram', quantity: 1, unitPrice: 85.00, taxRate: 18 },
      { description: 'Clinical Pathology In-Clinic Specimen Collection', quantity: 1, unitPrice: 15.00, taxRate: 5 }
    ],
    status: 'Paid',
    paymentMethod: 'Insurance',
    notes: 'Corporate health insurance claim processed successfully. Co-pay of $20 settled.'
  },
  {
    id: 'INV-3012',
    patientId: 'PAT-4212',
    patientName: 'Evelyn Montgomery',
    date: '2026-06-20',
    dueDate: '2026-07-20',
    items: [
      { description: 'Comprehensive Hematology Lab Screening Suite', quantity: 1, unitPrice: 160.00, taxRate: 18 },
      { description: 'Clinical Dietitian Consultation Session', quantity: 1, unitPrice: 90.00, taxRate: 5 }
    ],
    status: 'Pending',
    notes: 'Awaiting balance payment from private billing account.'
  }
];

const initialEmails: Email[] = [
  {
    id: 'EML-501',
    from: 'notification@hospital.com',
    to: 'alexander.sterling@gmail.com',
    subject: 'Appointment Scheduled Confirmation - June 27',
    body: 'Dear Alexander, this email confirms your upcoming appointment with Dr. Sarah Connor on June 27, 2026 at 09:00 AM. Please arrive 15 minutes early and complete your pre-appointment wellness questionnaires.',
    timestamp: '2026-06-25 10:00 AM',
    status: 'Sent'
  },
  {
    id: 'EML-502',
    from: 'support@hospital.com',
    to: 'evelyn.mont@yahoo.com',
    subject: 'Complete Blood Count Lab Results Ready',
    body: 'Hi Evelyn, your Complete Blood Count (CBC) and Iron Panel results are ready for download in your dashboard. Dr. Helen Cho will discuss these details with you during your virtual session today at 02:00 PM.',
    timestamp: '2026-06-20 11:30 AM',
    status: 'Sent'
  }
];

const initialNotifications: NotificationItem[] = [
  {
    id: 'NOT-01',
    title: 'Critical Report Issued',
    message: 'Evelyn Montgomery blood ferritin indicator flagged Low (12 ng/mL). Please verify clinical priority.',
    type: 'warning',
    timestamp: '2026-06-27 08:30 AM',
    read: false,
    module: 'Lab'
  },
  {
    id: 'NOT-02',
    title: 'New Appointment Booked',
    message: 'Alexander Sterling confirmed slot with Dr. Connor today at 09:00 AM.',
    type: 'success',
    timestamp: '2026-06-27 07:15 AM',
    read: false,
    module: 'Appointments'
  },
  {
    id: 'NOT-03',
    title: 'Invoice Payment Overdue',
    message: 'Patient Evelyn Montgomery balance of $254.50 remains unpaid after 7 days.',
    type: 'info',
    timestamp: '2026-06-26 05:00 PM',
    read: true,
    module: 'Billing'
  }
];

const initialAuditLogs: AuditLog[] = [
  {
    id: 'LOG-001',
    userId: 'SYS-USR-01',
    username: 'jayasriraam',
    action: 'User Authentication successfully verified via Secure Token Exchange',
    module: 'Auth',
    ipAddress: '192.168.1.104',
    timestamp: '2026-06-27 02:19 AM',
    status: 'Success'
  },
  {
    id: 'LOG-002',
    userId: 'SYS-USR-01',
    username: 'jayasriraam',
    action: 'Advanced filters triggered over clinical patient registry directories',
    module: 'Patients',
    ipAddress: '192.168.1.104',
    timestamp: '2026-06-27 02:22 AM',
    status: 'Success'
  }
];

const initialChatSessions: ChatSession[] = [
  {
    id: 'CHAT-001',
    title: 'Patient Anemia Diagnostic Planner',
    pinned: true,
    createdAt: '2026-06-26 14:00 PM',
    messages: [
      {
        id: 'MSG-01',
        sender: 'user',
        content: 'Evaluate Evelyn Montgomery hematology reports and recommend an agent action plan.',
        timestamp: '2026-06-26 14:00 PM'
      },
      {
        id: 'MSG-02',
        sender: 'assistant',
        content: 'Analyzing Evelyn Montgomery’s files... I see **LAB-201** Complete Blood Count & Iron Panel (uploaded June 20). Here is my clinical evaluation and recommended action plan:\n\n### 🧬 Diagnosis Overview\n* **Ferritin (12 ng/mL)**: Low (Clinical reference range: 15 - 150)\n* **Hemoglobin (11.4 g/dL)**: Low (Clinical range: 12.0 - 15.5)\n* **RBC (3.9 M/µL)**: Marginally Low\n\n### 🛡️ Recommended Clinical Actions (Planner Agent Outline):\n1. **Doctor Agent Consultation**: Arrange consultation with Dr. Helen Cho to evaluate potential oral iron gluconate / sulfate prescriptions.\n2. **Billing Agent Audit**: Confirm billing status. Invoice **INV-3012** is currently Pending. Verify insurance co-pay parameters.\n3. **Dietary Scheduling**: Recommend high-bioavailability dietary iron counseling with clinic nutrition specialists.',
        timestamp: '2026-06-26 14:01 PM',
        agent: 'planner',
        status: 'completed'
      }
    ]
  }
];

export const useAppStore = create<AppState>((set) => {
  // Load initial theme or default to dark (high-contrast professional styling)
  const savedTheme = typeof window !== 'undefined' ? (localStorage.getItem('app-theme') as 'light' | 'dark' || 'dark') : 'dark';
  const savedPins = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('app-pins') || '["Dashboard", "Patients", "Appointments", "AI Chat", "Billing"]') : ["Dashboard", "Patients", "Appointments", "AI Chat", "Billing"];

  return {
    // Auth
    currentUser: null,
    isAuthenticated: false,
    login: (user) => {
      persistAuthUser(user);
      set({
        currentUser: user,
        isAuthenticated: true
      });
      // Add audit log
      set((state) => ({
        auditLogs: [
          {
            id: `LOG-${Date.now()}`,
            userId: user.id,
            username: user.name,
            action: `User Authenticated as ${user.role}`,
            module: 'Auth',
            ipAddress: '192.168.1.1',
            timestamp: new Date().toLocaleString(),
            status: 'Success'
          },
          ...state.auditLogs
        ]
      }));
    },
    restoreSession: (user) => {
      persistAuthUser(user);
      set({ currentUser: user, isAuthenticated: true });
    },
    logout: () => {
      persistAuthUser(null);
      set({ currentUser: null, isAuthenticated: false });
    },
    updateProfile: (profile) => {
      set((state) => {
        const currentUser = state.currentUser ? { ...state.currentUser, ...profile } : null;
        persistAuthUser(currentUser);
        return { currentUser };
      });
    },

    // Theme
    theme: savedTheme,
    toggleTheme: () => set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('app-theme', nextTheme);
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (nextTheme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
      return { theme: nextTheme };
    }),

    // Pins
    pins: savedPins,
    togglePin: (moduleName) => set((state) => {
      const isPinned = state.pins.includes(moduleName);
      const nextPins = isPinned 
        ? state.pins.filter(p => p !== moduleName) 
        : [...state.pins, moduleName];
      localStorage.setItem('app-pins', JSON.stringify(nextPins));
      return { pins: nextPins };
    }),

    isSidebarOpen: true,
    setSidebarOpen: (open) => set({ isSidebarOpen: open }),
    isTabLoading: false,
    setIsTabLoading: (loading) => set({ isTabLoading: loading }),

    // Patients CRUD
    patients: initialPatients,
    addPatient: (patient) => set((state) => {
      const newPat: Patient = {
        ...patient,
        id: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
        documents: []
      };
      return { patients: [newPat, ...state.patients] };
    }),
    updatePatient: (id, updated) => set((state) => ({
      patients: state.patients.map(p => p.id === id ? { ...p, ...updated } : p)
    })),
    deletePatient: (id) => set((state) => ({
      patients: state.patients.filter(p => p.id !== id)
    })),

    // Appointments CRUD
    appointments: initialAppointments,
    addAppointment: (appointment) => set((state) => {
      const newApt: Appointment = {
        ...appointment,
        id: `APT-${Math.floor(1000 + Math.random() * 9000)}`
      };
      return { appointments: [newApt, ...state.appointments] };
    }),
    updateAppointment: (id, updated) => set((state) => ({
      appointments: state.appointments.map(a => a.id === id ? { ...a, ...updated } : a)
    })),
    deleteAppointment: (id) => set((state) => ({
      appointments: state.appointments.filter(a => a.id !== id)
    })),

    // Doctors CRUD
    doctors: initialDoctors,
    updateDoctor: (id, updated) => set((state) => ({
      doctors: state.doctors.map(d => d.id === id ? { ...d, ...updated } : d)
    })),

    // Lab Reports CRUD
    labReports: initialLabReports,
    addLabReport: (report) => set((state) => {
      const newLab: LabReport = {
        ...report,
        id: `LAB-${Math.floor(100 + Math.random() * 900)}`,
        uploadedAt: new Date().toLocaleString()
      };
      return { labReports: [newLab, ...state.labReports] };
    }),
    updateLabReport: (id, updated) => set((state) => ({
      labReports: state.labReports.map(l => l.id === id ? { ...l, ...updated } : l)
    })),
    deleteLabReport: (id) => set((state) => ({
      labReports: state.labReports.filter(l => l.id !== id)
    })),

    // Invoices CRUD
    invoices: initialInvoices,
    addInvoice: (invoice) => set((state) => {
      const newInv: Invoice = {
        ...invoice,
        id: `INV-${Math.floor(3000 + Math.random() * 999)}`,
        date: new Date().toISOString().split('T')[0]
      };
      return { invoices: [newInv, ...state.invoices] };
    }),
    updateInvoice: (id, updated) => set((state) => ({
      invoices: state.invoices.map(inv => inv.id === id ? { ...inv, ...updated } : inv)
    })),

    // AI Chat Sessions State
    chatSessions: initialChatSessions,
    activeSessionId: 'CHAT-001',
    addChatSession: () => {
      const newId = `CHAT-${Date.now()}`;
      set((state) => {
        const newSession: ChatSession = {
          id: newId,
          title: `New AI Medical Consult`,
          pinned: false,
          createdAt: new Date().toLocaleString(),
          messages: [
            {
              id: `MSG-${Date.now()}`,
              sender: 'assistant',
              content: 'Greetings. I am your integrated AI Hospital Agent. I can coordinate diagnostics (Lab Agent), invoice checks (Billing Agent), schedule appointments (Appointment Agent), or analyze medical records (Doctor Agent). What clinical queries can I resolve for you today?',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        };
        return {
          chatSessions: [newSession, ...state.chatSessions],
          activeSessionId: newId
        };
      });
      return newId;
    },
    deleteChatSession: (id) => set((state) => {
      const remaining = state.chatSessions.filter(c => c.id !== id);
      const nextActive = state.activeSessionId === id 
        ? (remaining.length > 0 ? remaining[0].id : null) 
        : state.activeSessionId;
      return { chatSessions: remaining, activeSessionId: nextActive };
    }),
    renameChatSession: (id, title) => set((state) => ({
      chatSessions: state.chatSessions.map(c => c.id === id ? { ...c, title } : c)
    })),
    togglePinChat: (id) => set((state) => ({
      chatSessions: state.chatSessions.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c)
    })),
    addMessageToSession: (sessionId, message) => set((state) => ({
      chatSessions: state.chatSessions.map(c => {
        if (c.id === sessionId) {
          const newMsg: ChatMessage = {
            ...message,
            id: `MSG-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          return {
            ...c,
            messages: [...c.messages, newMsg]
          };
        }
        return c;
      })
    })),
    updateLastMessageStatus: (sessionId, status, content) => set((state) => ({
      chatSessions: state.chatSessions.map(c => {
        if (c.id === sessionId && c.messages.length > 0) {
          const updatedMessages = [...c.messages];
          const lastIndex = updatedMessages.length - 1;
          const lastMsg = updatedMessages[lastIndex];
          if (lastMsg.sender === 'assistant') {
            updatedMessages[lastIndex] = {
              ...lastMsg,
              status,
              ...(content !== undefined ? { content } : {})
            };
          }
          return { ...c, messages: updatedMessages };
        }
        return c;
      })
    })),

    // Email Panel
    emails: initialEmails,
    sendEmail: (email) => set((state) => {
      const newEmail: Email = {
        ...email,
        id: `EML-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        status: 'Sent'
      };
      return { emails: [newEmail, ...state.emails] };
    }),
    saveDraftEmail: (email) => {
      const newId = `EML-${Date.now()}`;
      set((state) => {
        const newEmail: Email = {
          ...email,
          id: newId,
          timestamp: new Date().toLocaleString(),
          status: 'Draft'
        };
        return { emails: [newEmail, ...state.emails] };
      });
      return newId;
    },
    deleteEmail: (id) => set((state) => ({
      emails: state.emails.filter(e => e.id !== id)
    })),

    // Notifications state
    notifications: initialNotifications,
    addNotification: (noti) => set((state) => {
      const newNoti: NotificationItem = {
        ...noti,
        id: `NOT-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        read: false
      };
      return { notifications: [newNoti, ...state.notifications] };
    }),
    markNotificationAsRead: (id) => set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    })),
    markAllNotificationsAsRead: () => set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    })),
    clearNotifications: () => set({ notifications: [] }),

    // Admin Logs
    auditLogs: initialAuditLogs,
    addAuditLog: (action, module, status) => set((state) => {
      const newLog: AuditLog = {
        id: `LOG-${Date.now()}`,
        userId: state.currentUser?.id || 'ANONYMOUS',
        username: state.currentUser?.name || 'anonymous',
        action,
        module,
        ipAddress: '192.168.1.104',
        timestamp: new Date().toLocaleString(),
        status
      };
      return { auditLogs: [newLog, ...state.auditLogs] };
    }),

    // Routing State Router Simulation fallback
    activeTab: 'Dashboard',
    setActiveTab: (tab) => {
      set({ isTabLoading: true, activeTab: tab });
      setTimeout(() => {
        set({ isTabLoading: false });
      }, 550);
    }
  };
});
