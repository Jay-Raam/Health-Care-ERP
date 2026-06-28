import React, { useState } from 'react';
import { useAppStore } from '@/src/store/appStore';
import { useNotification } from '@/src/hooks/useApp';
import { useNavigate } from 'react-router-dom';
import { 
  StatCard, StickyNoteWidget, TodoWidget, AIQuickPromptBar, StatusBadge 
} from '@/src/components/ui/shared';
import { 
  Plus, Calendar, Users, HeartPulse, Receipt, ShieldCheck, 
  Activity, ArrowUpRight, CheckSquare, Bell, ArrowRight, FileText
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const addAppointment = useAppStore((state) => state.addAppointment);
  const addPatient = useAppStore((state) => state.addPatient);
  const addNotification = useAppStore((state) => state.addNotification);
  const addAuditLog = useAppStore((state) => state.addAuditLog);
  const pins = useAppStore((state) => state.pins);
  const currentUser = useAppStore((state) => state.currentUser);
  const patients = useAppStore((state) => state.patients);
  const appointments = useAppStore((state) => state.appointments);

  // Quick state for widgets
  const [stickyNotes, setStickyNotes] = useState<string[]>([
    'Ensure blood panel review for Evelyn Montgomery by 2PM.',
    'Refer Alexander Sterling to Dr. Connor for cardiac test results.'
  ]);
  const [todos, setTodos] = useState<{ text: string; done: boolean }[]>([
    { text: 'Acknowledge low ferritin level notification', done: false },
    { text: 'Authorize outstanding ECG invoice claim', done: true },
    { text: 'Verify weekend doctor schedule availability', done: false }
  ]);

  const { triggerToast } = useNotification();

  const handleAddNote = (text: string) => {
    setStickyNotes([...stickyNotes, text]);
    triggerToast('Sticky Note Added', 'Clinical scratchnote saved.', 'success');
  };

  const handleDeleteNote = (idx: number) => {
    setStickyNotes(stickyNotes.filter((_, i) => i !== idx));
  };

  const handleToggleTodo = (idx: number) => {
    setTodos(todos.map((t, i) => i === idx ? { ...t, done: !t.done } : t));
  };

  const handleAddTodo = (text: string) => {
    setTodos([...todos, { text, done: false }]);
  };

  const handleDeleteTodo = (idx: number) => {
    setTodos(todos.filter((_, i) => i !== idx));
  };

  // AI Prompt Redirect
  const handleAIPrompt = (promptText: string) => {
    const chatSessionId = useAppStore.getState().chatSessions[0]?.id;
    if (chatSessionId) {
      useAppStore.getState().addMessageToSession(chatSessionId, {
        sender: 'user',
        content: promptText
      });
      // Set assistant thinking...
      useAppStore.getState().addMessageToSession(chatSessionId, {
        sender: 'assistant',
        content: 'Planner Agent is evaluating your custom prompt...',
        agent: 'planner',
        status: 'working'
      });
      
      // Fast simulation of completion
      setTimeout(() => {
        useAppStore.getState().updateLastMessageStatus(
          chatSessionId, 
          'completed', 
          `Processed prompt: **"${promptText}"**.\n\n### 🤖 Diagnostics Summary & Recommendations\n* Resolved related indices successfully.\n* Cross-referenced existing clinical database parameters.\n* Standardized diagnostic protocols enforced.`
        );
      }, 1500);
    }
    navigate('/ai-chat');
  };

  const patientRecord = patients.find(p => p.email.toLowerCase() === currentUser?.email?.toLowerCase());
  const patientAppointments = appointments.filter(a => a.patientName === currentUser?.name || a.patientId === currentUser?.id);

  const mockPatientRecord = {
    id: 'PAT-NEW',
    name: currentUser?.name || 'Valued Patient',
    email: currentUser?.email || 'patient@hospitalagent.ai',
    phone: '+1 (555) 000-0000',
    dob: '1995-06-15',
    gender: 'Male',
    bloodType: 'O+',
    address: 'Primary Residence Address',
    allergies: ['None reported'],
    medicalHistory: [
      { condition: 'Routine Physical', diagnosedDate: '2026-01-10', status: 'Completed', notes: 'All values within normal baseline ranges' }
    ],
    documents: [
      { id: 'DOCX-NEW', name: 'Welcome_Information_Packet.pdf', type: 'PDF', uploadedAt: 'Just now', size: '1.2 MB' }
    ]
  };

  if (currentUser?.role === 'PATIENT') {
    const record = patientRecord || mockPatientRecord;
    const nextApp = patientAppointments[0];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
        {/* Header Greeting */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-6 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
                Welcome back, {currentUser?.name}!
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Your medical dashboard summary, upcoming appointments, and care network updates.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Patient Portal Active
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Next Consultation"
            value={nextApp ? `${nextApp.date}` : 'No visits scheduled'}
            subtext={nextApp ? `${nextApp.time} with ${nextApp.doctorName}` : 'Book a new session'}
            trend={nextApp ? { value: 'Confirmed', isPositive: true } : undefined}
            icon={<Calendar size={16} />}
            onClick={() => navigate('/appointments')}
            accent="from-blue-500 to-indigo-500"
          />
          <StatCard 
            title="My Health Files"
            value={`${record.documents.length} document${record.documents.length !== 1 ? 's' : ''}`}
            subtext="Available for offline download"
            icon={<FileText size={16} />}
            onClick={() => navigate('/patients')}
            accent="from-emerald-500 to-teal-500"
          />
          <StatCard 
            title="Outstanding Balance"
            value="$0.00"
            subtext="All invoices cleared"
            trend={{ value: 'Paid', isPositive: true }}
            icon={<Receipt size={16} />}
            onClick={() => navigate('/patients')}
            accent="from-amber-500 to-yellow-500"
          />
          <StatCard 
            title="Registered Care Plan"
            value="Active"
            subtext="Standard Medical Benefits"
            icon={<ShieldCheck size={16} />}
            onClick={() => {}}
            accent="from-purple-500 to-pink-500"
          />
        </div>

        {/* Workspace Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vitals and Medical History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vitals Card */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4">
              <h3 className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                My Vitals (Latest Checkup)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-150 dark:border-zinc-800 text-center">
                  <span className="text-[10px] font-mono text-zinc-400 block">Blood Pressure</span>
                  <span className="text-base font-bold text-zinc-950 dark:text-white mt-1 block">118/76</span>
                  <span className="text-[9px] text-emerald-500 font-mono mt-0.5 block">Optimal</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-150 dark:border-zinc-800 text-center">
                  <span className="text-[10px] font-mono text-zinc-400 block">Heart Rate</span>
                  <span className="text-base font-bold text-zinc-950 dark:text-white mt-1 block">72 bpm</span>
                  <span className="text-[9px] text-emerald-500 font-mono mt-0.5 block">Normal</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-150 dark:border-zinc-800 text-center">
                  <span className="text-[10px] font-mono text-zinc-400 block">Pulse Oximetry</span>
                  <span className="text-base font-bold text-zinc-950 dark:text-white mt-1 block">98%</span>
                  <span className="text-[9px] text-emerald-500 font-mono mt-0.5 block">Optimal</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-150 dark:border-zinc-800 text-center">
                  <span className="text-[10px] font-mono text-zinc-400 block">Body Temp</span>
                  <span className="text-base font-bold text-zinc-950 dark:text-white mt-1 block">98.6 °F</span>
                  <span className="text-[9px] text-emerald-500 font-mono mt-0.5 block">Normal</span>
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4">
              <h3 className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Medical Records & Active Diagnostics
              </h3>
              {record.medicalHistory.length > 0 ? (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {record.medicalHistory.map((item, idx) => (
                    <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold text-zinc-900 dark:text-white">{item.condition}</span>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{item.notes}</p>
                        <span className="text-[9px] text-zinc-400 font-mono block mt-1">Diagnosed: {item.diagnosedDate}</span>
                      </div>
                      <StatusBadge status={item.status === 'Active' ? 'warning' : 'success'} text={item.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">No medical condition history recorded.</p>
              )}
            </div>
          </div>

          {/* Right Column: Files / Actions */}
          <div className="space-y-6">
            {/* My Care Network / Doctor Panel */}
            {nextApp && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4">
                <h3 className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Upcoming Consult Details
                </h3>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                    <HeartPulse size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white block">{nextApp.doctorName}</span>
                    <span className="text-[10px] text-zinc-400 block">{nextApp.type} Appointment</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-150 dark:border-zinc-800 text-xs text-zinc-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{nextApp.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Slot:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{nextApp.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-semibold text-emerald-500">{nextApp.status}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Health Files & Uploads */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4">
              <h3 className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                My Clinical Documents ({record.documents.length})
              </h3>
              <div className="space-y-2">
                {record.documents.map((doc, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate block">{doc.name}</span>
                      <span className="text-[9px] text-zinc-400 font-mono mt-0.5 block">{doc.size} • Uploaded: {doc.uploadedAt}</span>
                    </div>
                    <button 
                      onClick={() => triggerToast('Download Started', `Downloading ${doc.name}`, 'info')}
                      className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
                    >
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Page Title Context bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white font-sans">
            Clinical Agent Dashboard
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-sans">
            Realtime administrative intelligence, clinician calendars, and diagnostic workflow trackers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Shift active • 2026-06-27
          </span>
        </div>
      </div>

      {/* 2. Top Statistic Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Appointments today"
          value="4 active"
          subtext="2 completed, 1 pending review"
          trend={{ value: '+12%', isPositive: true }}
          icon={<Calendar size={16} />}
          onClick={() => navigate('/appointments')}
          accent="from-blue-500 to-indigo-500"
        />
        <StatCard 
          title="Hospital Patients"
          value="3,801"
          subtext="+3 registered since last shift"
          trend={{ value: '+1.4%', isPositive: true }}
          icon={<Users size={16} />}
          onClick={() => navigate('/patients')}
          accent="from-emerald-500 to-teal-500"
        />
        <StatCard 
          title="Revenue (Current Week)"
          value="$11,200"
          subtext="18% GST ($1,708) included"
          trend={{ value: '+24%', isPositive: true }}
          icon={<Receipt size={16} />}
          onClick={() => navigate('/billing')}
          accent="from-amber-500 to-yellow-500"
        />
        <StatCard 
          title="Lab Reports Scanned"
          value="24"
          subtext="1 critical warning flagged"
          trend={{ value: '-2%', isPositive: false }}
          icon={<HeartPulse size={16} />}
          onClick={() => navigate('/lab-reports')}
          accent="from-purple-500 to-pink-500"
        />
      </div>

      {/* 3. Core Workspace Grid (Split dashboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Charts & Appointments */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Beautiful Custom SVG Line Chart */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Revenue Trend Line
                </h3>
                <p className="text-lg font-bold text-zinc-900 dark:text-white mt-1">
                  Weekly Hospital Billings
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/20">
                GST: 18% Calculated
              </span>
            </div>

            {/* Custom High-Fidelity Responsive SVG Area Chart */}
            <div className="h-[200px] w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal gridlines */}
                <line x1="0" y1="40" x2="700" y2="40" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800/50" strokeDasharray="4 4" />
                <line x1="0" y1="100" x2="700" y2="100" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800/50" strokeDasharray="4 4" />
                <line x1="0" y1="160" x2="700" y2="160" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800/50" strokeDasharray="4 4" />

                {/* Shaded Area */}
                <path
                  d="M 10 160 L 100 130 L 200 145 L 300 90 L 400 105 L 500 50 L 690 20 L 690 180 L 10 180 Z"
                  fill="url(#chartGradient)"
                />

                {/* Line Path */}
                <path
                  d="M 10 160 L 100 130 L 200 145 L 300 90 L 400 105 L 500 50 L 690 20"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Scatter Plot Circles */}
                <circle cx="10" cy="160" r="4.5" className="fill-emerald-500 stroke-white dark:stroke-zinc-900" strokeWidth="2" />
                <circle cx="100" cy="130" r="4.5" className="fill-emerald-500 stroke-white dark:stroke-zinc-900" strokeWidth="2" />
                <circle cx="200" cy="145" r="4.5" className="fill-emerald-500 stroke-white dark:stroke-zinc-900" strokeWidth="2" />
                <circle cx="300" cy="90" r="4.5" className="fill-emerald-500 stroke-white dark:stroke-zinc-900" strokeWidth="2" />
                <circle cx="400" cy="105" r="4.5" className="fill-emerald-500 stroke-white dark:stroke-zinc-900" strokeWidth="2" />
                <circle cx="500" cy="50" r="4.5" className="fill-emerald-500 stroke-white dark:stroke-zinc-900" strokeWidth="2" />
                <circle cx="690" cy="20" r="4.5" className="fill-emerald-500 stroke-white dark:stroke-zinc-900" strokeWidth="2" />
              </svg>

              {/* Day Labels along bottom */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 font-mono text-[9px] text-zinc-400">
                {chartDays.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions and Pinned Access Tiles */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4">
            <h3 className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Clinician Core Workspaces & Quick Links
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button 
                onClick={() => navigate('/patients')}
                className="flex flex-col items-start p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-left transition-all"
              >
                <Users size={16} className="text-blue-500 mb-2" />
                <span className="text-xs font-semibold">Patients</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">CRUD Directory</span>
              </button>
              
              <button 
                onClick={() => navigate('/appointments')}
                className="flex flex-col items-start p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-left transition-all"
              >
                <Calendar size={16} className="text-emerald-500 mb-2" />
                <span className="text-xs font-semibold">Schedules</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Scheduler</span>
              </button>

              <button 
                onClick={() => navigate('/lab-reports')}
                className="flex flex-col items-start p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-left transition-all"
              >
                <Activity size={16} className="text-purple-500 mb-2" />
                <span className="text-xs font-semibold">Lab Scans</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">AI Summaries</span>
              </button>

              <button 
                onClick={() => navigate('/billing')}
                className="flex flex-col items-start p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-left transition-all"
              >
                <Receipt size={16} className="text-amber-500 mb-2" />
                <span className="text-xs font-semibold">Billing</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Invoicing logs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Prompt Bar, Checklist, Notes */}
        <div className="space-y-6">
          
          {/* AI Prompt Widget */}
          <AIQuickPromptBar onSubmit={handleAIPrompt} />

          {/* Today's Shift Checklist */}
          <TodoWidget 
            todos={todos}
            onToggleTodo={handleToggleTodo}
            onAddTodo={handleAddTodo}
            onDeleteTodo={handleDeleteTodo}
          />

          {/* Clinician Sticky Notes */}
          <StickyNoteWidget 
            notes={stickyNotes}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
          />

          {/* Today's schedule summary */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-3">
            <h3 className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              <span>Immediate Alerts</span>
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/20">
                <div className="font-semibold text-rose-800 dark:text-rose-400">Low Hematology Levels Flagged</div>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">Evelyn Montgomery blood ferritin indicator reported Low (12 ng/mL).</p>
                <button 
                  onClick={() => navigate('/lab-reports')}
                  className="mt-2 text-[11px] font-mono text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1.5 font-semibold"
                >
                  Inspect details <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
