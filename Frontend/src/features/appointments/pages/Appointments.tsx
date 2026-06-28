import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/src/store/appStore';
import { useNotification } from '@/src/hooks/useApp';
import { PageHeader, StatusBadge, EmptyState, Modal } from '@/src/components/ui/shared';
import CalendarComponent from '@/src/components/CalendarComponent';
import { 
  Calendar as CalendarIcon, Clock, Plus, Trash2, Edit, Check, X,
  User, Sparkles, Filter, ChevronLeft, ChevronRight, CheckCircle, AlertCircle,
  CalendarDays, ListCollapse
} from 'lucide-react';

export default function Appointments() {
  const appointments = useAppStore((state) => state.appointments);
  const fetchAppointments = useAppStore((state) => state.fetchAppointments);
  const addAppointment = useAppStore((state) => state.addAppointment);
  const updateAppointment = useAppStore((state) => state.updateAppointment);
  const deleteAppointment = useAppStore((state) => state.deleteAppointment);
  const patients = useAppStore((state) => state.patients);
  const fetchPatients = useAppStore((state) => state.fetchPatients);
  const doctors = useAppStore((state) => state.doctors);
  const fetchDoctors = useAppStore((state) => state.fetchDoctors);
  const pins = useAppStore((state) => state.pins);
  const togglePin = useAppStore((state) => state.togglePin);
  const currentUser = useAppStore((state) => state.currentUser);

  const { triggerToast } = useNotification();

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchDoctors();
        if (currentUser?.role !== 'PATIENT') {
          await fetchPatients();
        }
        await fetchAppointments();
      } catch (err) {
        console.error('Error initializing appointments workspace:', err);
      }
    };
    loadData();
  }, [currentUser]);

  // Workspace Tabs: 'planner' (gorgeous multi-view calendar) or 'directory' (original logs list)
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'planner' | 'directory'>('planner');

  // Active view filters for Directory tab
  const [activeFilter, setActiveFilter] = useState<'All' | 'Upcoming' | 'Pending' | 'Completed' | 'Cancelled'>('All');
  const [selectedDay, setSelectedDay] = useState<number | null>(27); // Default to current day: 27th

  // Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '2026-06-27',
    time: '09:00 AM',
    type: 'Consultation' as 'Consultation' | 'Follow-up' | 'Emergency' | 'Operation' | 'Lab Review',
    notes: ''
  });

  // Automatically retrieve Patient ID from local storage if user is a Patient
  useEffect(() => {
    if (isAddOpen && currentUser?.role === 'PATIENT') {
      try {
        const saved = localStorage.getItem('app-auth-user');
        if (saved) {
          const user = JSON.parse(saved);
          if (user && user.role === 'PATIENT' && user.id) {
            setFormData(prev => ({
              ...prev,
              patientId: user.id
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching patient ID from local storage:', err);
      }
    }
  }, [isAddOpen, currentUser]);

  // Generate Appointment Recommendations based on doctor availability, working hours, and history
  const generateRecommendations = () => {
    if (doctors.length === 0) {
      return [];
    }
    const list: any[] = [];
    
    const activePatients = currentUser?.role === 'PATIENT'
      ? (currentUser.id ? [{ id: currentUser.id, name: currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : currentUser.email, email: currentUser.email }] : [])
      : patients;

    activePatients.forEach((patient, idx) => {
      const history = appointments.filter(a => a.patientId === patient.id);
      
      let preferredDoctor = doctors[idx % doctors.length] || doctors[0];
      if (history.length > 0) {
        const docCounts: Record<string, number> = {};
        history.forEach(h => {
          docCounts[h.doctorId] = (docCounts[h.doctorId] || 0) + 1;
        });
        const preferredDocId = Object.keys(docCounts).reduce((a, b) => docCounts[a] > docCounts[b] ? a : b, preferredDoctor.id);
        const foundDoc = doctors.find(d => d.id === preferredDocId);
        if (foundDoc) {
          preferredDoctor = foundDoc;
        }
      }

      let appType = 'Routine Checkup';
      let message = '';
      let priority = 'Medium';
      let duration = '30 mins';

      if (history.length === 0) {
        appType = 'New Patient Visit';
        message = `First-time consultation slot optimized based on clinic working hours and ${preferredDoctor.name}'s initial slot availability.`;
        priority = 'High';
        duration = '45 mins';
      } else {
        const lastApp = history[history.length - 1];
        if (lastApp.type === 'Consultation') {
          appType = 'Follow-up Appointment';
          message = `Suggested follow-up schedule aligned with preferred doctor ${preferredDoctor.name} to review progress from the previous appointment.`;
          priority = 'High';
          duration = '30 mins';
        } else if (lastApp.type === 'Lab Review') {
          appType = 'Medication Review';
          message = `Recommended medication checkup scheduled according to standard interval guidelines and physician availability.`;
          priority = 'Medium';
          duration = '30 mins';
        } else {
          appType = 'Annual Health Check';
          message = `Periodic routine preventive health checkup suggested based on department availability and clinic scheduling optimization.`;
          priority = 'Low';
          duration = '60 mins';
        }
      }

      let suggestedDate = '2026-06-29';
      let suggestedTime = '10:00 AM';

      if (preferredDoctor && preferredDoctor.availability && preferredDoctor.availability.length > 0) {
        const availabilityDay = preferredDoctor.availability[0];
        const dayOfWeek = availabilityDay.day;
        const timeSlot = availabilityDay.slots[0] || '10:00 AM';
        suggestedTime = timeSlot;

        if (dayOfWeek === 'Monday') {
          suggestedDate = '2026-06-29';
        } else if (dayOfWeek === 'Tuesday') {
          suggestedDate = '2026-06-30';
        } else if (dayOfWeek === 'Wednesday') {
          suggestedDate = '2026-07-01';
        } else if (dayOfWeek === 'Thursday') {
          suggestedDate = '2026-07-02';
        } else if (dayOfWeek === 'Friday') {
          suggestedDate = '2026-07-03';
        }
      }

      if (preferredDoctor && preferredDoctor.availability && preferredDoctor.availability.length > 0) {
        const slots = preferredDoctor.availability[0].slots;
        for (const slot of slots) {
          const hasConflict = appointments.some(a => 
            a.doctorId === preferredDoctor.id && 
            a.date === suggestedDate && 
            a.time === slot
          );
          if (!hasConflict) {
            suggestedTime = slot;
            break;
          }
        }
      }

      let location = 'Main Clinic - 1st Floor';
      if (preferredDoctor.department === 'Cardiology') {
        location = 'Heart & Vascular Center - Suite 4';
      } else if (preferredDoctor.department === 'Neurology') {
        location = 'Neurology Dept - Wing B';
      } else if (preferredDoctor.department === 'Lab & Diagnostics') {
        location = 'Diagnostics Lab - Wing A';
      } else if (preferredDoctor.department === 'Emergency Medicine') {
        location = 'Emergency Suite - Ground Floor';
      }

      list.push({
        patientId: patient.id,
        patientName: patient.name,
        appointmentType: appType,
        message: message,
        recommendedDoctor: preferredDoctor.name,
        specialty: preferredDoctor.specialization || 'Specialist',
        doctorId: preferredDoctor.id,
        suggestedDate: suggestedDate,
        suggestedTime: suggestedTime,
        duration: duration,
        doctorStatus: preferredDoctor.status || 'Active',
        priority: priority,
        location: location
      });
    });

    return list;
  };

  const appointmentRecommendations = generateRecommendations();

  // Filters appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = activeFilter === 'All' || apt.status === activeFilter;
    const matchesDay = !selectedDay || apt.date.endsWith(`-${selectedDay}`);
    return matchesStatus && matchesDay;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let resolvedPatientId = formData.patientId;
    // Fallback/Ensure retrieved from local storage if patient
    if (currentUser?.role === 'PATIENT') {
      try {
        const saved = localStorage.getItem('app-auth-user');
        if (saved) {
          const user = JSON.parse(saved);
          if (user && user.role === 'PATIENT' && user.id) {
            resolvedPatientId = user.id;
          }
        }
      } catch (err) {
        console.error('Error parsing user from localStorage:', err);
      }
    }

    if (!resolvedPatientId || !formData.doctorId) {
      triggerToast('Validation Error', 'Please select both patient and doctor.', 'error');
      return;
    }

    const patient = patients.find(p => p.id === resolvedPatientId);
    const doctor = doctors.find(d => d.id === formData.doctorId);

    let resolvedPatientName = '';
    if (patient) {
      resolvedPatientName = patient.name;
    } else if (currentUser && currentUser.role === 'PATIENT' && currentUser.id === resolvedPatientId) {
      resolvedPatientName = currentUser.name;
    } else {
      try {
        const saved = localStorage.getItem('app-auth-user');
        if (saved) {
          const user = JSON.parse(saved);
          if (user && user.id === resolvedPatientId) {
            resolvedPatientName = user.name;
          }
        }
      } catch {}
    }

    if (!resolvedPatientName || !doctor) {
      triggerToast('Validation Error', 'Patient record or clinician not found.', 'error');
      return;
    }

    addAppointment({
      patientId: resolvedPatientId,
      patientName: resolvedPatientName,
      doctorId: doctor.id,
      doctorName: doctor.name,
      date: formData.date,
      time: formData.time,
      type: formData.type,
      status: 'Upcoming',
      notes: formData.notes
    });

    triggerToast('Appointment Booked', `Successfully scheduled ${formData.type} with ${doctor.name}.`, 'success');
    setIsAddOpen(false);
    
    // Reset form
    let resetPatientId = '';
    if (currentUser?.role === 'PATIENT') {
      try {
        const saved = localStorage.getItem('app-auth-user');
        if (saved) {
          const user = JSON.parse(saved);
          if (user && user.role === 'PATIENT' && user.id) {
            resetPatientId = user.id;
          }
        }
      } catch {}
    }

    setFormData({
      patientId: resetPatientId,
      doctorId: '',
      date: '2026-06-27',
      time: '09:00 AM',
      type: 'Consultation',
      notes: ''
    });
  };

  const handleStatusChange = (id: string, nextStatus: 'Upcoming' | 'Completed' | 'Cancelled' | 'Pending') => {
    updateAppointment(id, { status: nextStatus });
    triggerToast('Status Updated', `Appointment marked as ${nextStatus}.`, 'success');
  };

  const handleDeleteClick = (id: string) => {
    if (confirm('Cancel and delete this appointment?')) {
      deleteAppointment(id);
      triggerToast('Appointment Revoked', 'The slot was deleted successfully.', 'warning');
    }
  };

  // Handle booking recommendation
  const handleRecommendationBook = (rec: any) => {
    let mappedType: 'Consultation' | 'Follow-up' | 'Emergency' | 'Operation' | 'Lab Review' = 'Consultation';
    if (rec.appointmentType.includes('Follow-up') || rec.appointmentType.includes('Medication')) {
      mappedType = 'Follow-up';
    } else if (rec.appointmentType.includes('Lab')) {
      mappedType = 'Lab Review';
    }

    addAppointment({
      patientId: rec.patientId,
      patientName: rec.patientName,
      doctorId: rec.doctorId,
      doctorName: rec.recommendedDoctor,
      date: rec.suggestedDate,
      time: rec.suggestedTime,
      type: mappedType,
      status: 'Upcoming',
      notes: `Recommended: ${rec.message} (Type: ${rec.appointmentType}, Duration: ${rec.duration})`
    });

    triggerToast('Appointment Booked', `Successfully scheduled ${rec.appointmentType} with ${rec.recommendedDoctor}.`, 'success');
  };

  const handleQuickBook = (prefilled?: { date: string; time: string }) => {
    let initialPatientId = '';
    if (currentUser?.role === 'PATIENT') {
      try {
        const saved = localStorage.getItem('app-auth-user');
        if (saved) {
          const user = JSON.parse(saved);
          if (user && user.role === 'PATIENT' && user.id) {
            initialPatientId = user.id;
          }
        }
      } catch (err) {
        console.error('Error parsing user from localStorage:', err);
      }
    }

    if (prefilled) {
      setFormData({
        patientId: initialPatientId,
        doctorId: '',
        date: prefilled.date,
        time: prefilled.time,
        type: 'Consultation',
        notes: ''
      });
    } else {
      setFormData({
        patientId: initialPatientId,
        doctorId: '',
        date: '2026-06-27',
        time: '09:00 AM',
        type: 'Consultation',
        notes: ''
      });
    }
    setIsAddOpen(true);
  };

  // Calendar render details
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      
      {/* 1. Page Header */}
      <PageHeader
        title="Schedule & Appointments"
        description="Configure clinicians slots, book patient appointments, and inspect predicted schedule optimizations."
        moduleName="Appointments"
        isPinned={pins.includes('Appointments')}
        onTogglePin={() => togglePin('Appointments')}
        breadcrumbs={[{ label: 'Scheduler' }, { label: 'Clinic Calendars', active: true }]}
        actions={
          <button
            onClick={() => handleQuickBook()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            <Plus size={14} />
            Book Appointment
          </button>
        }
      />

      {/* Primary Workspace Tab Switcher */}
      <div className="flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        <button
          onClick={() => setActiveWorkspaceTab('planner')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeWorkspaceTab === 'planner'
              ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          <CalendarDays size={14} />
          Interactive Clinic Planner
        </button>
        <button
          onClick={() => setActiveWorkspaceTab('directory')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeWorkspaceTab === 'directory'
              ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          <ListCollapse size={14} />
          Schedules Directory Logs
        </button>
      </div>

      {/* 2. Dynamic Appointments Workspaces Content */}
      {activeWorkspaceTab === 'planner' ? (
        <div className="space-y-6">
          {/* Majestic Interactive multi-view Calendar with Drag and Drop rescheduling */}
          <CalendarComponent onBookClick={handleQuickBook} />

          {/* Appointment Recommendations */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-500/5 dark:bg-zinc-500/5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays size={14} className="text-zinc-500" />
                Appointment Recommendations
              </span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-950/40 px-2 py-0.5 rounded font-bold">
                Schedule Coordinator
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointmentRecommendations.map((rec, i) => (
                <div key={i} className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 space-y-3 flex flex-col justify-between text-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs animate-in fade-in zoom-in-95 duration-200">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-zinc-950 dark:text-white text-sm">{rec.patientName}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-sm text-[9px] font-mono font-bold ${
                          rec.priority === 'High' 
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                            : rec.priority === 'Medium'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                        }`}>
                          {rec.priority} Priority
                        </span>
                        <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-300 rounded-sm text-[9px] font-semibold">
                          {rec.appointmentType}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px] italic bg-zinc-50 dark:bg-zinc-950/20 p-2 rounded-md">
                      {rec.message}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                      <div>
                        <span className="text-zinc-400">Doctor:</span> <span className="font-semibold text-zinc-700 dark:text-zinc-300">{rec.recommendedDoctor}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Specialty:</span> <span className="font-semibold text-zinc-700 dark:text-zinc-300">{rec.specialty}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Status:</span> <span className={`font-semibold ${
                          rec.doctorStatus === 'Active' || rec.doctorStatus === 'Available'
                            ? 'text-emerald-500'
                            : rec.doctorStatus === 'Busy'
                            ? 'text-amber-500'
                            : 'text-rose-500'
                        }`}>{rec.doctorStatus}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Duration:</span> <span className="font-semibold text-zinc-700 dark:text-zinc-300">{rec.duration}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-400">Location:</span> <span className="font-semibold text-zinc-700 dark:text-zinc-300">{rec.location}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-400">Suggested:</span> <span className="text-blue-500 dark:text-blue-400 font-semibold">{rec.suggestedDate} at {rec.suggestedTime}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRecommendationBook(rec)}
                    className="mt-3.5 w-full py-1.5 rounded-lg bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check size={12} />
                    Book Appointment
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Premium Clinical Grid Calendar */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Calendar Matrix
              </span>
              <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono">
                June 2026
              </span>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold text-zinc-400 font-mono mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <span key={d}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {/* Blank padding for June 2026 (starts on Monday, June 1st) */}
              <div className="aspect-square bg-transparent rounded-lg" />
              
              {daysInMonth.map((day) => {
                const hasAppts = appointments.some(a => a.date.endsWith(`-${day < 10 ? '0' + day : day}`));
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`aspect-square relative rounded-lg text-xs font-mono font-semibold flex items-center justify-center transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold shadow-xs' 
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span>{day}</span>
                    {hasAppts && !isSelected && (
                      <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Day selection description */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>Filtering day: {selectedDay ? `June ${selectedDay}, 2026` : 'All'}</span>
              {selectedDay && (
                <button onClick={() => setSelectedDay(null)} className="text-[10px] text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:underline cursor-pointer">
                  Clear filter
                </button>
              )}
            </div>
          </div>

          {/* Middle Column: Daily Appointment list / filtered schedules */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Status Tab buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 p-2.5 rounded-xl">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {(['All', 'Upcoming', 'Pending', 'Completed', 'Cancelled'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      activeFilter === filter 
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold' 
                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                Matches: {filteredAppointments.length}
              </span>
            </div>

            {/* Selected Schedules Card List */}
            <div className="space-y-3.5">
              {filteredAppointments.map((apt) => {
                const patient = patients.find(p => p.id === apt.patientId);
                return (
                  <div 
                    key={apt.id} 
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 flex flex-col sm:flex-row justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                          {apt.type}
                        </span>
                        <StatusBadge 
                          status={apt.status} 
                          type={
                            apt.status === 'Completed' ? 'success' :
                            apt.status === 'Cancelled' ? 'error' :
                            apt.status === 'Pending' ? 'warning' : 'info'
                          } 
                        />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                          <User size={14} className="text-zinc-400" />
                          {apt.patientName}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          Assigned: <span className="font-medium text-zinc-700 dark:text-zinc-300">{apt.doctorName}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 font-mono">
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon size={12} />
                          {apt.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} />
                          {apt.time}
                        </span>
                      </div>

                      {apt.notes && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal max-w-lg border-l border-zinc-200 dark:border-zinc-800 pl-3 italic">
                          "{apt.notes}"
                        </p>
                      )}
                    </div>

                    {/* Actions toolbar */}
                    <div className="sm:self-start flex sm:flex-col items-end gap-2.5">
                      <div className="flex items-center gap-1.5">
                        {apt.status === 'Upcoming' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'Completed')}
                            title="Mark Consultation completed"
                            className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors cursor-pointer"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {apt.status === 'Pending' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'Upcoming')}
                            title="Authorize consultation"
                            className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-blue-500/10 hover:text-blue-500 transition-colors cursor-pointer"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(apt.id)}
                          title="Delete slot schedule"
                          className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredAppointments.length === 0 && (
                <EmptyState 
                  title="Schedules empty" 
                  description={`No clinic slots logged for June ${selectedDay || 'selected'}`} 
                />
              )}
            </div>

            {/* Appointment Recommendations */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-500/5 dark:bg-zinc-500/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-zinc-500" />
                  Appointment Recommendations
                </span>
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-950/40 px-2 py-0.5 rounded font-bold">
                  Schedule Coordinator
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointmentRecommendations.map((rec, i) => (
                  <div key={i} className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 space-y-3 flex flex-col justify-between text-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-zinc-950 dark:text-white text-sm">{rec.patientName}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-sm text-[9px] font-mono font-bold ${
                            rec.priority === 'High' 
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                              : rec.priority === 'Medium'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {rec.priority} Priority
                          </span>
                          <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-sm text-[9px] font-semibold">
                            {rec.appointmentType}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px] italic bg-zinc-50 dark:bg-zinc-950/20 p-2 rounded-md">
                        {rec.message}
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                        <div>
                          <span className="text-zinc-400">Doctor:</span> <span className="font-semibold text-zinc-700 dark:text-zinc-300">{rec.recommendedDoctor}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400">Specialty:</span> <span className="font-semibold text-zinc-700 dark:text-zinc-300">{rec.specialty}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400">Status:</span> <span className={`font-semibold ${
                            rec.doctorStatus === 'Active' || rec.doctorStatus === 'Available'
                              ? 'text-emerald-500'
                              : rec.doctorStatus === 'Busy'
                              ? 'text-amber-500'
                              : 'text-rose-500'
                          }`}>{rec.doctorStatus}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400">Duration:</span> <span className="font-semibold text-zinc-700 dark:text-zinc-300">{rec.duration}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-zinc-400">Location:</span> <span className="font-semibold text-zinc-700 dark:text-zinc-300">{rec.location}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-zinc-400">Suggested:</span> <span className="text-blue-500 dark:text-blue-400 font-semibold">{rec.suggestedDate} at {rec.suggestedTime}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRecommendationBook(rec)}
                      className="mt-3.5 w-full py-1.5 rounded-lg bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check size={12} />
                      Book Appointment
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Book Appointment Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Schedule Medical Slot">
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          
          {currentUser?.role !== 'PATIENT' && (
            <div className="space-y-1.5">
              <label className="block font-semibold">Select Patient Record *</label>
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2"
                required
              >
                <option value="">-- Choose patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block font-semibold">Select Assigned Clinician *</label>
            <select
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2"
              required
            >
              <option value="">-- Choose physician --</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block font-semibold">Scheduled Date</label>
              <input 
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 font-mono font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold font-mono">Slot Time</label>
              <select
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 font-mono"
              >
                {['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold">Consultation Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5"
            >
              <option value="Consultation">Consultation</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Emergency">Emergency</option>
              <option value="Operation">Operation</option>
              <option value="Lab Review">Lab Review</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold">Special Notes / Clinical Directives</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Bring diagnostic scan prints..."
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2 font-sans"
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold"
            >
              Book Medical Slot
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
