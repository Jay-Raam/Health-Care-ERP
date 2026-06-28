import React, { useState } from 'react';
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
  const addAppointment = useAppStore((state) => state.addAppointment);
  const updateAppointment = useAppStore((state) => state.updateAppointment);
  const deleteAppointment = useAppStore((state) => state.deleteAppointment);
  const patients = useAppStore((state) => state.patients);
  const doctors = useAppStore((state) => state.doctors);
  const pins = useAppStore((state) => state.pins);
  const togglePin = useAppStore((state) => state.togglePin);

  const { triggerToast } = useNotification();

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

  // AI Suggestions Data
  const aiSuggestions = [
    {
      patientId: 'PAT-4212',
      patientName: 'Evelyn Montgomery',
      condition: 'Anemia Review Needed',
      recommendedDoctor: 'Dr. Helen Cho',
      doctorId: 'DOC-103',
      recommendedDate: '2026-06-28',
      recommendedTime: '11:00 AM',
      type: 'Lab Review' as const,
      reason: 'Hematology panel has Low iron markers. Prompt clinician review is advised.'
    },
    {
      patientId: 'PAT-3011',
      patientName: 'Marcus Vance',
      condition: 'Diabetes Follow-up',
      recommendedDoctor: 'Dr. David Marcus',
      doctorId: 'DOC-102',
      recommendedDate: '2026-06-29',
      recommendedTime: '03:30 PM',
      type: 'Follow-up' as const,
      reason: 'Bi-annual neuropathy assesment is due. Dr. Marcus has 2 open slots.'
    }
  ];

  // Filters appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = activeFilter === 'All' || apt.status === activeFilter;
    const matchesDay = !selectedDay || apt.date.endsWith(`-${selectedDay}`);
    return matchesStatus && matchesDay;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId) {
      triggerToast('Validation Error', 'Please select both patient and doctor.', 'error');
      return;
    }

    const patient = patients.find(p => p.id === formData.patientId);
    const doctor = doctors.find(d => d.id === formData.doctorId);

    if (!patient || !doctor) return;

    addAppointment({
      patientId: patient.id,
      patientName: patient.name,
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
    setFormData({
      patientId: '',
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

  // 1-Click AI Suggestion Booking
  const handleAIScheduleBook = (sug: typeof aiSuggestions[0]) => {
    addAppointment({
      patientId: sug.patientId,
      patientName: sug.patientName,
      doctorId: sug.doctorId,
      doctorName: sug.recommendedDoctor,
      date: sug.recommendedDate,
      time: sug.recommendedTime,
      type: sug.type,
      status: 'Upcoming',
      notes: `AI Recommended: ${sug.reason}`
    });

    triggerToast('Optimized Booking Saved', `Successfully booked ${sug.patientName} with ${sug.recommendedDoctor} via AI 1-Click.`, 'success');
  };

  const handleQuickBook = (prefilled?: { date: string; time: string }) => {
    if (prefilled) {
      setFormData({
        patientId: '',
        doctorId: '',
        date: prefilled.date,
        time: prefilled.time,
        type: 'Consultation',
        notes: ''
      });
    } else {
      setFormData({
        patientId: '',
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

          {/* AI Clinical Predictive Scheduler optimization suggestions */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-purple-500/5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-500 animate-pulse" />
                AI Predictive Schedule Optimizer
              </span>
              <span className="text-[10px] font-mono text-purple-500 bg-purple-100 dark:bg-purple-950/40 px-2 py-0.5 rounded font-bold">
                HIPAA Compliant
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiSuggestions.map((sug, i) => (
                <div key={i} className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-purple-200/50 dark:border-purple-950/40 space-y-3 flex flex-col justify-between text-xs">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-950 dark:text-white">{sug.patientName}</span>
                      <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-sm text-[9px] font-mono font-bold">
                        {sug.condition}
                      </span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">{sug.reason}</p>
                    <div className="pt-2 font-mono text-[10px] text-zinc-400 space-y-0.5">
                      <div>Recommended Doctor: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{sug.recommendedDoctor}</span></div>
                      <div>Slot suggestion: <span className="text-purple-500 font-semibold">{sug.recommendedDate} at {sug.recommendedTime}</span></div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAIScheduleBook(sug)}
                    className="mt-3.5 w-full py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check size={12} />
                    Book Optimized Slot
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

            {/* AI Clinical Predictive Scheduler optimization suggestions */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-purple-500/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-500 animate-pulse" />
                  AI Predictive Schedule Optimizer
                </span>
                <span className="text-[10px] font-mono text-purple-500 bg-purple-100 dark:bg-purple-950/40 px-2 py-0.5 rounded font-bold">
                  HIPAA Compliant
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiSuggestions.map((sug, i) => (
                  <div key={i} className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-purple-200/50 dark:border-purple-950/40 space-y-3 flex flex-col justify-between text-xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-950 dark:text-white">{sug.patientName}</span>
                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-sm text-[9px] font-mono font-bold">
                          {sug.condition}
                        </span>
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">{sug.reason}</p>
                      <div className="pt-2 font-mono text-[10px] text-zinc-400 space-y-0.5">
                        <div>Recommended Doctor: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{sug.recommendedDoctor}</span></div>
                        <div>Slot suggestion: <span className="text-purple-500 font-semibold">{sug.recommendedDate} at {sug.recommendedTime}</span></div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAIScheduleBook(sug)}
                      className="mt-3.5 w-full py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check size={12} />
                      Book Optimized Slot
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
