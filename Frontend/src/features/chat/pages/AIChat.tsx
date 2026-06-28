import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/src/store/appStore';
import { useNotification } from '@/src/hooks/useApp';
import { PageHeader, StatusBadge, EmptyState } from '@/src/components/ui/shared';
import { 
  MessageSquare, Pin, Plus, Trash2, Edit2, Send, Mic, Sparkles, 
  Paperclip, Terminal, FileText, CheckCircle2, RotateCw, AlertCircle, Eye, User
} from 'lucide-react';

export default function AIChat() {
  const chatSessions = useAppStore((state) => state.chatSessions);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const addChatSession = useAppStore((state) => state.addChatSession);
  const deleteChatSession = useAppStore((state) => state.deleteChatSession);
  const renameChatSession = useAppStore((state) => state.renameChatSession);
  const togglePinChat = useAppStore((state) => state.togglePinChat);
  const addMessageToSession = useAppStore((state) => state.addMessageToSession);
  const updateLastMessageStatus = useAppStore((state) => state.updateLastMessageStatus);
  const currentUser = useAppStore((state) => state.currentUser);

  const { triggerToast } = useNotification();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeSession = chatSessions.find(c => c.id === activeSessionId) || chatSessions[0];

  const [inputMessage, setInputMessage] = useState('');
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Agent parameters
  const [currentAgent, setCurrentAgent] = useState<'planner' | 'doctor' | 'billing' | 'lab' | 'appointment'>('planner');
  const [agentStatus, setAgentStatus] = useState<'working' | 'completed' | 'failed' | 'idle'>('idle');

  // Voice recording mock indicator
  const [isRecording, setIsRecording] = useState(false);

  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeSession) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    // 1. Add user message
    addMessageToSession(activeSession.id, {
      sender: 'user',
      content: userText
    });

    const role = currentUser?.role || 'PATIENT';
    const userName = currentUser?.name || 'User';

    // 2. Trigger active agent diagnostics loop
    setAgentStatus('working');
    addMessageToSession(activeSession.id, {
      sender: 'assistant',
      content: `Verifying authorization credentials for role: ${role}...`,
      agent: currentAgent,
      status: 'working'
    });

    // 3. Simulates streaming response with role-based checks
    setTimeout(() => {
      let responseContent = '';
      const lowercaseText = userText.toLowerCase();

      if (role === 'PATIENT') {
        // Patients cannot query other patients' details
        const patientNames = ['alexander', 'sterling', 'evelyn', 'montgomery', 'marcus', 'vance'];
        const matchesOtherPatient = patientNames.some(name => lowercaseText.includes(name)) && 
                                    !lowercaseText.includes(userName.toLowerCase().split(' ')[0]);

        if (matchesOtherPatient || lowercaseText.includes('other patient') || lowercaseText.includes('all patients')) {
          responseContent = `⛔ **Access Denied (Role: PATIENT)**\n\nAuthorization check failed for **${userName}**.\n\nAs a patient, you are strictly authorized to view only your own medical record, appointments, and prescriptions. Querying or accessing another patient's confidential health data is prohibited.`;
        } else {
          // Respond with personalized patient data
          if (currentAgent === 'planner') {
            responseContent = `### 📋 Personalized Care Plan (Patient: ${userName})\n\nHello **${userName}**, I have retrieved your patient records:\n\n* **Your Vitals**: Blood Pressure is optimal at 118/76 mmHg. Heart rate is stable at 72 bpm.\n* **Next Slot**: You have a consultation checkup scheduled for Monday, June 29th at 10:00 AM.\n* **Billing**: Your outstanding balances are fully cleared ($0.00).`;
          } else if (currentAgent === 'doctor') {
            responseContent = `### 🩺 Patient Health Advisory\n\nDear **${userName}**, here is the summary from your care network:\n\n* **Daily Guideline**: Stay hydrated and maintain your standard dietary guidelines.\n* **Prescriptions**: Keep taking your prescribed vitamins. Follow up if you experience any symptoms.`;
          } else if (currentAgent === 'billing') {
            responseContent = `### 💳 My Invoices & Claims\n\n* **Account Status**: Paid in full.\n* **Recent Charges**: $0.00 outstanding. Your health insurance co-pay covers active services.`;
          } else if (currentAgent === 'lab') {
            responseContent = `### 🧬 My Lab Reports\n\n* **Latest Upload**: Welcome Information Packet and clinical guidance guidelines. All active vitals report normal metabolic parameters.`;
          } else if (currentAgent === 'appointment') {
            responseContent = `### 📅 My Schedule Planner\n\n* **Upcoming Slot**: Monday, June 29th at 10:00 AM.\n* **Doctor**: Dr. Sarah Connor. Please check-in 10 minutes prior to your slot.`;
          }
        }
      } else if (role === 'RECEPTIONIST') {
        // Receptionists cannot view clinical/medical history or diagnostics
        const clinicalKeywords = ['diagnos', 'medical history', 'blood work', 'anemia', 'ferritin', 'hemoglobin', 'prescription', 'disease', 'condition'];
        const queriesClinical = clinicalKeywords.some(kw => lowercaseText.includes(kw));

        if (queriesClinical || currentAgent === 'doctor' || currentAgent === 'lab') {
          responseContent = `⛔ **Access Denied (Role: RECEPTIONIST)**\n\nAuthorization check failed for **${userName}**.\n\nAs a receptionist, you are authorized to manage appointment schedules, check-ins, and basic patient registrations. You do not have permissions to access confidential clinical medical records, prescriptions, or laboratory diagnostic details.`;
        } else {
          // Respond to scheduling / billing queries
          if (currentAgent === 'planner') {
            responseContent = `### 📋 Front-Desk Operations Summary\n\nActive check-ins and appointments are running on schedule:\n\n* **Appointments**: 4 active consultations today.\n* **Billing**: Verified active transactions. Daily invoices logged successfully.`;
          } else if (currentAgent === 'billing') {
            responseContent = `### 💳 Front-Desk Invoicing & Payments\n\n* **Daily Invoices**: 8 active invoices generated.\n* **Status**: 6 settled, 2 pending co-pay verification.`;
          } else if (currentAgent === 'appointment') {
            responseContent = `### 📅 Appointments Registry\n\n* **Next Slot**: Alexander Sterling scheduled with Dr. Connor at 09:00 AM.\n* **Availability**: 3 open slots remaining for afternoon walk-ins.`;
          }
        }
      } else if (role === 'NURSE') {
        // Nurses can access patient info based on assigned departments, but cannot view billing
        if (currentAgent === 'billing') {
          responseContent = `⛔ **Access Denied (Role: NURSE)**\n\nAuthorization check failed for **${userName}**.\n\nAs a nurse, you do not have permission to view or manage financial transactions, billing records, or GST billing configurations. Please contact the Billing Admin.`;
        } else {
          if (currentAgent === 'planner') {
            responseContent = `### 📋 Ward Care Plan (Nurse: ${userName})\n\nOrchestrating active care schedules for your assigned ward:\n\n* **Checklist**: 3 tasks pending (Evelyn Montgomery's ferritin review, ECG authorization check).\n* **Medication**: Confirm scheduled dosage tracking for ward patients.`;
          } else if (currentAgent === 'doctor') {
            responseContent = `### 🩺 Nurse Clinical Assisting\n\n* **Patient Vitals**: Recorded blood pressure and temperature logs for ward patients.\n* **Guideline**: Ensure IV refills and vitals charting are synchronized on schedule.`;
          } else if (currentAgent === 'lab') {
            responseContent = `### 🧬 Lab Reports Review\n\n* **Alerts**: Low Ferritin (12 ng/mL) flagged for Evelyn Montgomery. Ensure physician review is scheduled.`;
          } else if (currentAgent === 'appointment') {
            responseContent = `### 📅 Shift Schedules\n\n* **Upcoming Slots**: 2 patient consultations and 1 blood panel review scheduled during this shift.`;
          }
        }
      } else {
        // DOCTOR and ADMIN roles have full access to everything
        if (currentAgent === 'planner') {
          responseContent = `### 📋 Executive Clinical Operations (Role: ${role})\n\nFull administrative clearance granted for **${userName}**:\n\n* **Diagnostics**: Cross-referencing all database entries.\n* **Hospital Analytics**: Active operations normal. 3,801 patients, 24 lab scans, $11,200 revenue.`;
        } else if (currentAgent === 'doctor') {
          responseContent = `### 🩺 Physician Clinical Diagnostics\n\n* **Alexander Sterling**: Managed with Lisinopril 10mg daily for Hypertension. EKG normal.\n* **Evelyn Montgomery**: Mild Asthma, ferritin low (12 ng/mL). Iron supplements recommended.`;
        } else if (currentAgent === 'billing') {
          responseContent = `### 💳 Financial Ledger & Invoicing\n\n* **Revenue**: $11,200 collected. GST configuration at 18% is active and verified.\n* **Ledger**: Full ledger download available under Billing.`;
        } else if (currentAgent === 'lab') {
          responseContent = `### 🧬 Global Laboratory Register\n\n* **Anomalies**: Critical ferritin low flagged for PAT-4212. All other lab panels normal.`;
        } else if (currentAgent === 'appointment') {
          responseContent = `### 📅 Master Clinic Calendar\n\n* **Registry**: 4 active, 1 pending review. Doctors Choice blocks mapped for optimal patient routing.`;
        }
      }

      updateLastMessageStatus(activeSession.id, 'completed', responseContent);
      setAgentStatus('completed');
      triggerToast('AI Agent Responded', `Access authorized for role: ${role}.`, 'success');
    }, 1500);
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    triggerToast('Microphone Active', 'Clinical dictation streaming... speak clearly.', 'info');
    setTimeout(() => {
      setIsRecording(false);
      setInputMessage('Assess patient blood indicators and draft cardiac follow-up schedule.');
      triggerToast('Dictation Completed', 'Audio transcript mapped to message input.', 'success');
    }, 2500);
  };

  const handleRenameSubmit = (id: string) => {
    if (renameValue.trim()) {
      renameChatSession(id, renameValue.trim());
      setActiveEditingId(null);
      setRenameValue('');
      triggerToast('Chat Renamed', 'Topic header updated.', 'success');
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      
      {/* Page Header */}
      <div className="shrink-0">
        <PageHeader 
          title="Clinical Multi-Agent Console"
          description="Mobilize specialized clinical LLM agents to orchestrate diagnostics, schedule slots, and check invoices."
          breadcrumbs={[{ label: 'Agent Workspace' }, { label: 'Multi-Agent Chat', active: true }]}
        />
      </div>

      {/* Main Chat Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Left Column: Chat History Directory */}
        <div className="lg:col-span-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 flex flex-col overflow-hidden">
          <button
            onClick={() => {
              addChatSession();
              triggerToast('Consultation Initialized', 'New clinical agent channel created.', 'success');
            }}
            className="shrink-0 w-full mb-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-all"
          >
            <Plus size={14} />
            New AI Consult
          </button>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {chatSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => useAppStore.setState({ activeSessionId: session.id })}
                className={`p-3 rounded-lg text-xs transition-all relative group cursor-pointer border ${
                  activeSessionId === session.id 
                    ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-50 dark:bg-zinc-800/40 font-semibold' 
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                {activeEditingId === session.id ? (
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRenameSubmit(session.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(session.id);
                    }}
                    autoFocus
                    className="w-full bg-transparent border-b border-zinc-400 outline-hidden focus:outline-hidden"
                  />
                ) : (
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate pr-4 leading-normal">{session.title}</span>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 absolute right-2 top-2.5 bg-zinc-100 dark:bg-zinc-800 rounded px-1 py-0.5">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveEditingId(session.id);
                          setRenameValue(session.title);
                        }}
                        className="text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete chat session?')) {
                            deleteChatSession(session.id);
                          }
                        }}
                        className="text-zinc-400 hover:text-rose-500"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Columns: ChatGPT Chat box */}
        <div className="lg:col-span-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex flex-col overflow-hidden shadow-2xs">
          
          {/* Agent Selector Ribbon */}
          {currentUser?.role === 'PATIENT' && (
            <div className="shrink-0 px-4 py-3 border-b border-zinc-150 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/20">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Active Agent:</span>
                <div className="flex items-center gap-1">
                  {(['planner', 'doctor', 'appointment'] as const).map((agent) => (
                    <button
                      key={agent}
                      onClick={() => {
                        setCurrentAgent(agent);
                        triggerToast('Agent Mobilized', `Active focus: ${agent.toUpperCase()} agent.`, 'info');
                      }}
                      className={`px-2 py-1 rounded capitalize text-[10px] font-bold tracking-tight transition-all ${
                        currentAgent === agent 
                          ? 'bg-purple-600 text-white font-extrabold shadow-2xs' 
                          : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {agent}
                    </button>
                  ))}
                </div>
              </div>

              {/* Glowing active indicator */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold rounded-sm border ${
                  agentStatus === 'working' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  agentStatus === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  'bg-zinc-100 text-zinc-500 dark:bg-zinc-850 dark:text-zinc-400 border-zinc-200/50 dark:border-zinc-800'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full bg-current ${agentStatus === 'working' ? 'animate-pulse' : ''}`} />
                  {agentStatus === 'working' ? 'AGENT WORKING' : agentStatus === 'completed' ? 'WORK COMPLETED' : 'AGENT IDLE'}
                </span>
              </div>
            </div>
          )}

          {/* Messages stream viewport */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-zinc-50/20 dark:bg-zinc-950/20">
            {activeSession?.messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar Icon */}
                <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 ${
                  msg.sender === 'user' 
                    ? 'bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200' 
                    : 'bg-purple-600 border-purple-500 text-white'
                }`}>
                  {msg.sender === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                </div>

                {/* Message Box */}
                <div className={`rounded-2xl p-4 text-xs font-sans leading-relaxed space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-medium rounded-tr-none'
                    : 'bg-zinc-50/50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none whitespace-pre-line'
                }`}>
                  {msg.agent && (
                    <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-zinc-200/50 dark:border-zinc-800 font-mono text-[9px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">
                      <span>{msg.agent} agent output</span>
                      <span>•</span>
                      <span className={msg.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}>
                        {msg.status}
                      </span>
                    </div>
                  )}
                  
                  {/* Message main content */}
                  <div className="space-y-2 prose prose-zinc dark:prose-invert prose-xs">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Form message sender inputs */}
          <form onSubmit={handleSendMessage} className="shrink-0 p-4 border-t border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
            <div className="flex items-center gap-2.5">
              
              {/* Mic dictation */}
              <button
                type="button"
                onClick={startVoiceRecording}
                className={`p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors ${isRecording ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : ''}`}
                title="Dictate prompt via microphone"
              >
                <Mic size={15} className={isRecording ? 'animate-pulse' : ''} />
              </button>

              {/* Upload file triggers */}
              <button
                type="button"
                onClick={() => alert('Diagnostic artifact linkage triggered.')}
                className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-all"
                title="Attach diagnostic clinical logs"
              >
                <Paperclip size={15} />
              </button>

              {/* Text Input */}
              <input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Ask ${currentAgent.toUpperCase()} (e.g. Schedule follow-up for Alexander...)`}
                className="flex-1 min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden"
              />

              {/* Send Submit button */}
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 disabled:opacity-40 transition-all"
              >
                <Send size={15} />
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
