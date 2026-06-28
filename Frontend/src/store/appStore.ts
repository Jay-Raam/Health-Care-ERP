import { create } from 'zustand';
import { 
  Patient, Appointment, Doctor, LabReport, Invoice, 
  ChatSession, ChatMessage, Email, NotificationItem, AuditLog, UserProfile, UserRole 
} from '../types';
import {
  getMyAppointments,
  getDoctorsList,
  searchPatients,
  bookAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  formatTime12to24,
  calculateEndTime
} from '../features/appointments/api';

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
  approvePatient: (id: string) => void;

  // Appointments Module
  appointments: Appointment[];
  fetchAppointments: () => Promise<void>;
  fetchDoctors: () => Promise<void>;
  fetchPatients: () => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
  updateAppointment: (id: string, updated: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;

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
const initialDoctors: Doctor[] = [];

const initialPatients: Patient[] = [];

const initialAppointments: Appointment[] = [];

const initialLabReports: LabReport[] = [];

const initialInvoices: Invoice[] = [];

const initialEmails: Email[] = [];

const initialNotifications: NotificationItem[] = [];

const initialAuditLogs: AuditLog[] = [];

const initialChatSessions: ChatSession[] = [
  {
    id: 'CHAT-001',
    title: 'New AI Medical Consult',
    pinned: false,
    createdAt: new Date().toLocaleString(),
    messages: [
      {
        id: 'MSG-01',
        sender: 'assistant',
        content: 'Greetings. I am your integrated AI Hospital Agent. I can coordinate diagnostics (Lab Agent), invoice checks (Billing Agent), schedule appointments (Appointment Agent), or analyze medical records (Doctor Agent). What clinical queries can I resolve today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]
  }
];

export const useAppStore = create<AppState>((set) => {
  // Load initial theme or default to dark (high-contrast professional styling)
  const savedTheme = typeof window !== 'undefined' ? (localStorage.getItem('app-theme') as 'light' | 'dark' || 'dark') : 'dark';
  const savedPins = typeof window !== 'undefined' ? 
    JSON.parse(localStorage.getItem('app-pins') || '[]') : 
    [];

  const savedUser = typeof window !== 'undefined' ? localStorage.getItem('app-auth-user') : null;
  const initialUser = savedUser ? JSON.parse(savedUser) : null;
  const initialIsAuthenticated = !!initialUser;

  return {
    // Auth
    currentUser: initialUser,
    isAuthenticated: initialIsAuthenticated,
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
        documents: [],
        approved: false
      };
      return { patients: [newPat, ...state.patients] };
    }),
    updatePatient: (id, updated) => set((state) => ({
      patients: state.patients.map(p => p.id === id ? { ...p, ...updated } : p)
    })),
    deletePatient: (id) => set((state) => ({
      patients: state.patients.filter(p => p.id !== id)
    })),
    approvePatient: (id) => set((state) => ({
      patients: state.patients.map(p => p.id === id ? { ...p, approved: true } : p)
    })),

    // Appointments CRUD
    appointments: initialAppointments,
    fetchAppointments: async () => {
      try {
        const list = await getMyAppointments();
        set({ appointments: list });
      } catch (err) {
        console.error('Error fetching appointments:', err);
      }
    },
    fetchDoctors: async () => {
      try {
        const list = await getDoctorsList();
        set({ doctors: list });
      } catch (err) {
        console.error('Error fetching doctors:', err);
      }
    },
    fetchPatients: async () => {
      try {
        const list = await searchPatients('');
        set({ patients: list });
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    },
    addAppointment: async (appointment) => {
      try {
        const startTime24 = formatTime12to24(appointment.time);
        const endTime24 = calculateEndTime(startTime24);
        
        await bookAppointment({
          doctorId: appointment.doctorId,
          appointmentDate: appointment.date,
          startTime: startTime24,
          endTime: endTime24,
          reason: `${appointment.type}: ${appointment.notes || 'Consultation request'}`,
          patientId: appointment.patientId
        });
        
        const list = await getMyAppointments();
        set({ appointments: list });
      } catch (err) {
        console.error('Error booking appointment:', err);
        throw err;
      }
    },
    updateAppointment: async (id, updated) => {
      try {
        if (updated.date || updated.time) {
          const existing = useAppStore.getState().appointments.find(a => a.id === id);
          if (existing) {
            const date = updated.date || existing.date;
            const time12 = updated.time || existing.time;
            const startTime24 = formatTime12to24(time12);
            const endTime24 = calculateEndTime(startTime24);
            await rescheduleAppointment(id, date, startTime24, endTime24);
          }
        } else if (updated.status) {
          await updateAppointmentStatus(id, updated.status, updated.notes);
        }
        const list = await getMyAppointments();
        set({ appointments: list });
      } catch (err) {
        console.error('Error updating appointment:', err);
      }
    },
    deleteAppointment: async (id) => {
      try {
        await updateAppointmentStatus(id, 'Cancelled', 'Revoked by patient/staff');
        const list = await getMyAppointments();
        set({ appointments: list });
      } catch (err) {
        console.error('Error canceling appointment:', err);
      }
    },

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
