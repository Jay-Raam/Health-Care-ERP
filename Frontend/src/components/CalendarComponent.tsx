import React, { useState } from 'react';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/appStore';
import { useNotification } from '../hooks/useApp';
import { StatusBadge } from './ui/shared';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, 
  Sparkles, User, ShieldAlert, CheckCircle2, RefreshCw, Layers, CalendarRange
} from 'lucide-react';

const HOURS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM'
];

export default function CalendarComponent({ 
  onBookClick, 
  onEditClick 
}: { 
  onBookClick: (prefilled?: { date: string; time: string }) => void;
  onEditClick?: (appointmentId: string) => void;
}) {
  const appointments = useAppStore((state) => state.appointments);
  const updateAppointment = useAppStore((state) => state.updateAppointment);
  const patients = useAppStore((state) => state.patients);
  const doctors = useAppStore((state) => state.doctors);
  const { triggerToast } = useNotification();

  // Anchor the "today" concept to June 27, 2026 to align with mock database contents.
  const [currentDate, setCurrentDate] = useState(dayjs('2026-06-27'));
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  
  // Drag and drop local highlight tracking
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null); // "date-time"

  // Standard Navigation
  const handlePrev = () => {
    if (calendarView === 'month') {
      setCurrentDate(currentDate.subtract(1, 'month'));
    } else if (calendarView === 'week') {
      setCurrentDate(currentDate.subtract(1, 'week'));
    } else {
      setCurrentDate(currentDate.subtract(1, 'day'));
    }
  };

  const handleNext = () => {
    if (calendarView === 'month') {
      setCurrentDate(currentDate.add(1, 'month'));
    } else if (calendarView === 'week') {
      setCurrentDate(currentDate.add(1, 'week'));
    } else {
      setCurrentDate(currentDate.add(1, 'day'));
    }
  };

  const handleToday = () => {
    setCurrentDate(dayjs('2026-06-27'));
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnDay = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    setDragOverDay(null);
    const appointmentId = e.dataTransfer.getData('text/plain');
    if (!appointmentId) return;

    const apt = appointments.find(a => a.id === appointmentId);
    if (apt) {
      updateAppointment(appointmentId, { date: targetDate });
      triggerToast(
        'Rescheduled', 
        `Successfully moved ${apt.patientName}'s appointment to ${dayjs(targetDate).format('MMMM DD, YYYY')}.`, 
        'success'
      );
    }
  };

  const handleDropOnSlot = (e: React.DragEvent, targetDate: string, targetTime: string) => {
    e.preventDefault();
    setDragOverSlot(null);
    const appointmentId = e.dataTransfer.getData('text/plain');
    if (!appointmentId) return;

    const apt = appointments.find(a => a.id === appointmentId);
    if (apt) {
      updateAppointment(appointmentId, { date: targetDate, time: targetTime });
      triggerToast(
        'Rescheduled', 
        `Moved ${apt.patientName} to ${dayjs(targetDate).format('MMM DD')} at ${targetTime}.`, 
        'success'
      );
    }
  };

  // RENDER MONTH VIEW
  const renderMonthView = () => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startDate = startOfMonth.startOf('week');
    const endDate = endOfMonth.endOf('week');

    const calendarWeeks = [];
    let day = startDate;

    while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
      const days = [];
      for (let i = 0; i < 7; i++) {
        days.push(day);
        day = day.add(1, 'day');
      }
      calendarWeeks.push(days);
    }

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase font-mono tracking-wider">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-2 bg-zinc-50 dark:bg-zinc-950/40 rounded border border-zinc-100 dark:border-zinc-850">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarWeeks.flat().map((dateItem, idx) => {
            const dateStr = dateItem.format('YYYY-MM-DD');
            const isCurrentMonth = dateItem.isSame(currentDate, 'month');
            const isToday = dateItem.isSame(dayjs('2026-06-27'), 'day');
            const dayAppts = appointments.filter(a => a.date === dateStr);
            const isOver = dragOverDay === dateStr;

            return (
              <div
                key={idx}
                onDragOver={handleDragOver}
                onDragEnter={() => setDragOverDay(dateStr)}
                onDragLeave={() => setDragOverDay(null)}
                onDrop={(e) => handleDropOnDay(e, dateStr)}
                className={`min-h-[110px] rounded-xl border p-2 flex flex-col justify-between transition-all relative ${
                  isOver 
                    ? 'border-purple-500 bg-purple-500/5 ring-2 ring-purple-500/30 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 scale-[1.01]' 
                    : isToday
                      ? 'border-zinc-950 dark:border-white bg-zinc-50/50 dark:bg-zinc-900/30'
                      : isCurrentMonth
                        ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60'
                        : 'border-zinc-150 dark:border-zinc-850 bg-zinc-50/30 dark:bg-zinc-950/20 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono font-bold ${
                    isToday 
                      ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-1.5 py-0.5 rounded' 
                      : 'text-zinc-700 dark:text-zinc-300'
                  }`}>
                    {dateItem.date()}
                  </span>
                  
                  {/* Subtle Book button */}
                  <button
                    onClick={() => onBookClick({ date: dateStr, time: '09:00 AM' })}
                    className="opacity-0 hover:opacity-100 focus:opacity-100 p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all absolute top-2 right-2"
                    title="Book slot"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <div className="flex-1 mt-2.5 space-y-1 overflow-y-auto max-h-[72px] scrollbar-thin">
                  {dayAppts.map(apt => (
                    <div
                      key={apt.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, apt.id)}
                      className="group cursor-grab active:cursor-grabbing p-1 px-1.5 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-[9px] hover:border-zinc-400 dark:hover:border-zinc-500 hover:shadow-xs transition-all"
                      title={`${apt.patientName} (${apt.time}) - Drag to reschedule`}
                    >
                      <div className="truncate font-sans font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">{apt.patientName}</span>
                      </div>
                      <span className="font-mono text-[8px] text-zinc-400 shrink-0 select-none">
                        {apt.time.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>

                {dayAppts.length > 0 && (
                  <div className="text-[8px] font-mono text-zinc-400 mt-1 text-right">
                    {dayAppts.length} {dayAppts.length === 1 ? 'apt' : 'apts'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // RENDER WEEK VIEW
  const renderWeekView = () => {
    const startOfWeek = currentDate.startOf('week');
    const weekDays = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));

    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <div className="min-w-[800px] grid grid-cols-8 divide-x divide-zinc-200 dark:divide-zinc-800 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
            {/* Hour header spacer */}
            <div className="p-3 text-center flex flex-col justify-center">
              <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase">Time</span>
            </div>
            {/* Weekday headers */}
            {weekDays.map(wd => {
              const dateStr = wd.format('YYYY-MM-DD');
              const isToday = wd.isSame(dayjs('2026-06-27'), 'day');
              return (
                <div key={dateStr} className={`p-3 text-center space-y-0.5 ${isToday ? 'bg-zinc-550/10 dark:bg-white/5' : ''}`}>
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase font-mono">{wd.format('ddd')}</div>
                  <div className={`inline-block font-mono font-bold text-sm ${isToday ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-2 py-0.5 rounded-full' : 'text-zinc-800 dark:text-zinc-200'}`}>
                    {wd.format('D')}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="min-w-[800px] divide-y divide-zinc-150 dark:divide-zinc-850">
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-8 divide-x divide-zinc-200 dark:divide-zinc-800 hover:bg-zinc-50/30 dark:hover:bg-zinc-950/10 transition-colors">
                {/* Left Hour Label */}
                <div className="p-2 text-center font-mono text-[9px] text-zinc-400 flex items-center justify-center font-semibold uppercase">
                  {hour}
                </div>

                {/* Day Cells */}
                {weekDays.map(wd => {
                  const dateStr = wd.format('YYYY-MM-DD');
                  const keyStr = `${dateStr}-${hour}`;
                  const slotAppts = appointments.filter(a => a.date === dateStr && a.time === hour);
                  const isOver = dragOverSlot === keyStr;

                  return (
                    <div
                      key={wd.format('YYYY-MM-DD')}
                      onDragOver={handleDragOver}
                      onDragEnter={() => setDragOverSlot(keyStr)}
                      onDragLeave={() => setDragOverSlot(null)}
                      onDrop={(e) => handleDropOnSlot(e, dateStr, hour)}
                      className={`p-2 min-h-[68px] relative transition-all group flex flex-col justify-between ${
                        isOver 
                          ? 'bg-purple-500/10 border-2 border-dashed border-purple-500' 
                          : 'bg-transparent'
                      }`}
                    >
                      {/* Plus button inside empty hours */}
                      {slotAppts.length === 0 && (
                        <button
                          onClick={() => onBookClick({ date: dateStr, time: hour })}
                          className="absolute inset-0 m-auto h-6 w-6 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-2xs hover:scale-105"
                        >
                          <Plus size={12} />
                        </button>
                      )}

                      <div className="space-y-1 w-full">
                        {slotAppts.map(apt => (
                          <div
                            key={apt.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, apt.id)}
                            className="p-1 px-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-550/5 dark:bg-zinc-950/30 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-grab active:cursor-grabbing text-[9px] flex flex-col"
                            title={`${apt.patientName} - Drag to reschedule`}
                          >
                            <span className="font-bold text-zinc-900 dark:text-white truncate">{apt.patientName}</span>
                            <span className="text-[8px] text-zinc-400 mt-0.5 font-mono truncate">{apt.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // RENDER TODAY (DAY TIMELINE) VIEW
  const renderDayView = () => {
    const dateStr = currentDate.format('YYYY-MM-DD');
    const dayAppts = appointments.filter(a => a.date === dateStr);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Full Hourly Schedule */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-850 pb-3">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-zinc-400" />
              <h3 className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">
                Clinician Slots Grid
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              Selected: {currentDate.format('MMM DD, YYYY')}
            </span>
          </div>

          <div className="divide-y divide-zinc-150 dark:divide-zinc-850 relative">
            {HOURS.map(hour => {
              const hourAppts = dayAppts.filter(a => a.time === hour);
              const keyStr = `${dateStr}-${hour}`;
              const isOver = dragOverSlot === keyStr;

              return (
                <div
                  key={hour}
                  onDragOver={handleDragOver}
                  onDragEnter={() => setDragOverSlot(keyStr)}
                  onDragLeave={() => setDragOverSlot(null)}
                  onDrop={(e) => handleDropOnSlot(e, dateStr, hour)}
                  className={`py-3 flex items-start gap-4 transition-all relative group ${
                    isOver 
                      ? 'bg-purple-500/5 ring-2 ring-purple-500/30' 
                      : ''
                  }`}
                >
                  {/* Time label */}
                  <div className="w-16 shrink-0 font-mono text-[10px] font-bold text-zinc-400 uppercase pt-1">
                    {hour}
                  </div>

                  {/* Appointments / Slots Area */}
                  <div className="flex-1 min-h-[44px] flex flex-wrap gap-2 items-center">
                    {hourAppts.length > 0 ? (
                      hourAppts.map(apt => (
                        <div
                          key={apt.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, apt.id)}
                          className="p-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 cursor-grab active:cursor-grabbing text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-1 min-w-[200px] shadow-2xs hover:shadow-xs transition-all"
                          title="Drag to change scheduled hour"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="font-bold text-zinc-900 dark:text-white">{apt.patientName}</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-bold uppercase text-zinc-500">
                                {apt.type}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-400 font-medium">
                              Physician: <span className="text-zinc-600 dark:text-zinc-300">{apt.doctorName}</span>
                            </div>
                            {apt.notes && (
                              <div className="text-[10px] text-zinc-400 italic max-w-sm border-l border-zinc-200 pl-2">
                                "{apt.notes}"
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <StatusBadge 
                              status={apt.status} 
                              type={
                                apt.status === 'Completed' ? 'success' :
                                apt.status === 'Cancelled' ? 'error' :
                                apt.status === 'Pending' ? 'warning' : 'info'
                              } 
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-zinc-400 italic flex items-center justify-between w-full pr-2">
                        <span>No consultations scheduled</span>
                        <button
                          onClick={() => onBookClick({ date: dateStr, time: hour })}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:underline transition-opacity"
                        >
                          <Plus size={11} />
                          Quick book
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Quick Patient Card List */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-2xs space-y-4">
            <h4 className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">
              Today's Patient Overview
            </h4>
            <div className="space-y-3">
              {dayAppts.length > 0 ? (
                dayAppts.map(apt => {
                  const pat = patients.find(p => p.id === apt.patientId);
                  return (
                    <div key={apt.id} className="p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-lg border border-zinc-200/60 dark:border-zinc-850 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-zinc-900 dark:text-white">{apt.patientName}</span>
                        <span className="font-mono text-[10px] text-zinc-400">{apt.time}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 space-y-0.5">
                        <div>ID: <span className="font-mono">{apt.patientId}</span></div>
                        {pat && (
                          <>
                            <div>Phone: <span>{pat.phone}</span></div>
                            <div>Blood Type: <span className="font-mono uppercase">{pat.bloodType}</span></div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-zinc-400 italic text-center py-6">
                  No patients scheduled on this date
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Calendar View Toggle and Navigation Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 p-4 rounded-2xl shadow-2xs">
        {/* Left Side: View Mode Toggles */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl">
          {(['month', 'week', 'day'] as const).map(view => (
            <button
              key={view}
              onClick={() => setCalendarView(view)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all flex items-center gap-1.5 ${
                calendarView === view
                  ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
              }`}
            >
              {view === 'month' && <CalendarIcon size={13} />}
              {view === 'week' && <Layers size={13} />}
              {view === 'day' && <Clock size={13} />}
              {view}
            </button>
          ))}
        </div>

        {/* Center: Month/Year Title */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrev}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs sm:text-sm font-bold font-mono tracking-tight text-zinc-900 dark:text-white select-none">
            {calendarView === 'day' 
              ? currentDate.format('MMMM DD, YYYY') 
              : calendarView === 'week'
                ? `Week of ${currentDate.startOf('week').format('MMM D, YYYY')}`
                : currentDate.format('MMMM YYYY')}
          </span>
          <button 
            onClick={handleNext}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Right Side: Reset to Anchored Today */}
        <button
          onClick={handleToday}
          className="px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <CalendarRange size={13} />
          Anchored Today
        </button>
      </div>

      {/* Main Dynamic View Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={calendarView + currentDate.format('YYYY-MM-DD')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {calendarView === 'month' && renderMonthView()}
          {calendarView === 'week' && renderWeekView()}
          {calendarView === 'day' && renderDayView()}
        </motion.div>
      </AnimatePresence>

      {/* Interactive Helper Banner */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl border border-purple-200/50 bg-purple-500/5 text-purple-600 dark:text-purple-400 text-xs leading-relaxed font-sans shadow-2xs animate-pulse">
        <Sparkles size={14} className="shrink-0 text-purple-500" />
        <div>
          <span className="font-bold">Pro Clinical Schedulingtip:</span> Drag and drop any patient card on the Month, Week, or Day timelines to automatically reschedule and coordinate availability instantly.
        </div>
      </div>
    </div>
  );
}
