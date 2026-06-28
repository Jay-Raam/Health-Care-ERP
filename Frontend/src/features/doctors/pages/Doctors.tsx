import React, { useState } from 'react';
import { useAppStore } from '@/src/store/appStore';
import { useNotification } from '@/src/hooks/useApp';
import { PageHeader, StatusBadge, EmptyState } from '@/src/components/ui/shared';
import { 
  HeartPulse, Phone, Mail, Search, Award, Check, Clock, 
  Star, Calendar, UserCheck, ShieldAlert 
} from 'lucide-react';

export default function Doctors() {
  const doctors = useAppStore((state) => state.doctors);
  const updateDoctor = useAppStore((state) => state.updateDoctor);
  const appointments = useAppStore((state) => state.appointments);
  const pins = useAppStore((state) => state.pins);
  const togglePin = useAppStore((state) => state.togglePin);

  const { triggerToast } = useNotification();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [selectedDocId, setSelectedDocId] = useState<string>(doctors[0]?.id || '');

  // Filter Logic
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || doc.specialization === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const selectedDoctor = doctors.find(d => d.id === selectedDocId) || doctors[0];

  const handleStatusToggle = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Busy' : currentStatus === 'Busy' ? 'On Leave' : 'Active';
    updateDoctor(id, { status: nextStatus });
    triggerToast('Status Revised', `Dr. ${selectedDoctor.name.split('. ')[1]} updated to ${nextStatus}.`, 'success');
  };

  // Past Consultation History for Selected Doctor
  const doctorAppointments = appointments.filter(a => a.doctorId === selectedDoctor?.id && a.status === 'Completed');

  const specialtiesList = ['All', 'Cardiologist', 'Neurologist', 'Hematologist & Diagnostics', 'Emergency Physician'];

  return (
    <div className="space-y-6">
      
      {/* 1. Page Header */}
      <PageHeader 
        title="Doctor Directory"
        description="Verify physician specializations, real-time weekly availability grids, and historic diagnostic histories."
        moduleName="Doctors"
        isPinned={pins.includes('Doctors')}
        onTogglePin={() => togglePin('Doctors')}
        breadcrumbs={[{ label: 'Directory' }, { label: 'Assigned Clinicians', active: true }]}
      />

      {/* 2. Top Search Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 p-4 rounded-xl shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by physician name or department..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {specialtiesList.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedSpecialty === spec 
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Immersive Splitted Grid workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left column: Doctor Registry Directory */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDoctors.map((doc) => (
            <div 
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[200px] ${
                selectedDocId === doc.id 
                  ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-50/50 dark:bg-zinc-900/30' 
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-700 dark:text-zinc-200 border border-zinc-200/50 dark:border-zinc-700">
                      {doc.name.split(' ')[1]?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">{doc.name}</h3>
                      <p className="text-[10px] text-zinc-400 font-mono font-medium">{doc.id} • {doc.department}</p>
                    </div>
                  </div>
                  <StatusBadge 
                    status={doc.status} 
                    type={doc.status === 'Active' ? 'success' : doc.status === 'Busy' ? 'warning' : 'error'} 
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Award size={13} className="text-zinc-400" />
                    {doc.specialization}
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Star size={13} className="text-amber-500 fill-amber-500" />
                    <span>{doc.rating} / 5 Rating</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Slots: {doc.availability.reduce((acc, curr) => acc + curr.slots.length, 0)} open</span>
                <span className="text-[10px] text-zinc-500 hover:underline font-semibold flex items-center gap-1">
                  View Schedule Matrix &rarr;
                </span>
              </div>
            </div>
          ))}

          {filteredDoctors.length === 0 && (
            <div className="col-span-2">
              <EmptyState 
                title="No physicians found" 
                description="Adjust searching terms or select a different department specialization." 
              />
            </div>
          )}
        </div>

        {/* Right column: Weekly Availability and consultation History panel */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-6">
          {selectedDoctor ? (
            <>
              {/* Doctor Details Summary */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950 dark:text-white">{selectedDoctor.name}</h3>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">{selectedDoctor.specialization} • rating {selectedDoctor.rating}</span>
                  </div>
                  <button
                    onClick={() => handleStatusToggle(selectedDoctor.id, selectedDoctor.status)}
                    className="px-2.5 py-1 text-[10px] font-mono font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded border border-zinc-200/50 dark:border-zinc-700 transition-colors"
                  >
                    Set status: {selectedDoctor.status}
                  </button>
                </div>

                <div className="space-y-1.5 py-3 border-y border-zinc-150 dark:border-zinc-800 text-xs font-mono text-zinc-500">
                  <div className="flex items-center gap-2">
                    <Mail size={13} />
                    <span className="text-zinc-700 dark:text-zinc-300">{selectedDoctor.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} />
                    <span className="text-zinc-700 dark:text-zinc-300">{selectedDoctor.phone}</span>
                  </div>
                </div>
              </div>

              {/* Weekly Open Slots calendar view */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-950 dark:text-white uppercase font-mono tracking-wider text-[10px] text-zinc-400">
                  Weekly Open Slots Calendar
                </h4>
                
                <div className="space-y-3">
                  {selectedDoctor.availability.map((av) => (
                    <div key={av.day} className="space-y-1.5 text-xs">
                      <div className="font-mono text-[10px] font-bold text-zinc-500 uppercase">{av.day}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {av.slots.map((sl) => (
                          <span 
                            key={sl} 
                            onClick={() => triggerToast('Slot selected', `Apt request sent for ${av.day} at ${sl}`, 'info')}
                            className="px-2 py-1 rounded-md bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200/50 dark:border-zinc-800 font-mono text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold cursor-pointer transition-all"
                          >
                            {sl}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consultation histories */}
              <div className="space-y-2.5 pt-4 border-t border-zinc-150 dark:border-zinc-850">
                <h4 className="text-xs font-bold text-zinc-950 dark:text-white uppercase font-mono tracking-wider text-[10px] text-zinc-400">
                  Consultation Logs
                </h4>
                
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {doctorAppointments.map((apt) => (
                    <div key={apt.id} className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-zinc-800 dark:text-zinc-200">{apt.patientName}</span>
                        <span className="text-[10px] font-mono text-zinc-400">{apt.date}</span>
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400 mt-1 italic text-[11px] leading-tight">
                        "{apt.notes}"
                      </p>
                    </div>
                  ))}
                  {doctorAppointments.length === 0 && (
                    <p className="text-xs text-zinc-400 italic">No past completed sessions logged.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-xs text-zinc-400 italic">
              Select a physician from the directory.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
