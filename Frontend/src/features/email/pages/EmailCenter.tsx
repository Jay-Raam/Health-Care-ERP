import React, { useState } from 'react';
import { useAppStore } from '@/src/store/appStore';
import { useNotification } from '@/src/hooks/useApp';
import { PageHeader, StatusBadge, EmptyState, Modal } from '@/src/components/ui/shared';
import { 
  Mail, Inbox, Send, Edit, Trash2, Search, Plus, 
  FileText, CornerUpLeft, Paperclip, Eye, EyeOff, Check
} from 'lucide-react';

export default function EmailCenter() {
  const emails = useAppStore((state) => state.emails);
  const sendEmail = useAppStore((state) => state.sendEmail);
  const deleteEmail = useAppStore((state) => state.deleteEmail);
  const pins = useAppStore((state) => state.pins);
  const togglePin = useAppStore((state) => state.togglePin);

  const { triggerToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'Inbox' | 'Sent' | 'Draft'>('Sent');
  const [selectedEmailId, setSelectedEmailId] = useState<string>(emails[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Form compose modals
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: ''
  });

  const selectedEmail = emails.find(e => e.id === selectedEmailId) || emails[0];

  // Filtering Logic
  const filteredEmails = emails.filter((em) => {
    const matchesTab = em.status === activeTab;
    const matchesSearch = em.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          em.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Clinical Quick Templates Macros
  const clinicalTemplates = [
    {
      title: 'Lab CBC Low Iron Alert',
      subject: 'Urgent: Hematology Lab Panel Discussion Required',
      body: 'Dear Patient,\n\nWe have reviewed your Complete Blood Count (CBC) and Iron Panel indicators. Your Ferritin level is reported Marginally Low (12 ng/mL).\n\nPlease schedule a consultation with our diagnostics team chief, Dr. Helen Cho, to evaluate potential dietary modifications or oral iron supplements.\n\nWarm regards,\nAstra Clinic Diagnostics'
    },
    {
      title: 'Cardiac Consult Reminder',
      subject: 'Schedule Confirmation: Cardiovascular checkup with Dr. Connor',
      body: 'Dear Alexander,\n\nThis is a courtesy reminder of your upcoming cardiovascular consultation with Dr. Sarah Connor on Saturday at 09:00 AM.\n\nPlease complete your pre-appointment wellness questionnaires in your dashboard at least 1 hour prior to arrival.\n\nWarm regards,\nClinical Administration'
    }
  ];

  const handleApplyTemplate = (bodyText: string, subjText: string) => {
    setFormData({
      to: 'alexander.sterling@gmail.com',
      subject: subjText,
      body: bodyText
    });
    triggerToast('Template Applied', 'Clinical email preset mapped.', 'success');
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.to || !formData.subject || !formData.body) {
      triggerToast('Validation Error', 'Please complete all required fields.', 'error');
      return;
    }

    sendEmail({
      from: 'notification@hospital.com',
      to: formData.to,
      subject: formData.subject,
      body: formData.body
    });

    triggerToast('Email Sent', `Message safely routed to ${formData.to}`, 'success');
    setIsComposeOpen(false);
    
    // Reset form
    setFormData({ to: '', subject: '', body: '' });
  };

  const handleDeleteEmail = (id: string) => {
    deleteEmail(id);
    triggerToast('Mail Archive Cleared', 'Email removed from clinical history logs.', 'warning');
    if (selectedEmailId === id) {
      setSelectedEmailId('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <PageHeader 
        title="Email Communications"
        description="Verify automated patient notification dispatches, review draft templates, and compose customized medical notifications."
        moduleName="Email Center"
        isPinned={pins.includes('Email Center')}
        onTogglePin={() => togglePin('Email Center')}
        breadcrumbs={[{ label: 'System Mail' }, { label: 'Dispatches Hub', active: true }]}
        actions={
          <button
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-lg text-xs font-semibold hover:opacity-90"
          >
            <Plus size={14} />
            Compose Dispatch
          </button>
        }
      />

      {/* Workspace Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Folders, Searches, lists */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Folders tabs */}
          <div className="grid grid-cols-3 gap-1 bg-white dark:bg-zinc-900 p-1 border border-zinc-200/50 dark:border-zinc-800 rounded-lg">
            {(['Inbox', 'Sent', 'Draft'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedEmailId('');
                }}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === tab 
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Mail search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject or recipient..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 focus:outline-hidden"
            />
          </div>

          {/* Mail list stack */}
          <div className="space-y-2.5">
            {filteredEmails.map((em) => (
              <div
                key={em.id}
                onClick={() => setSelectedEmailId(em.id)}
                className={`p-3.5 rounded-xl border cursor-pointer text-xs transition-all ${
                  selectedEmailId === em.id 
                    ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-50/50 dark:bg-zinc-900/30' 
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-750'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">{em.to}</span>
                  <span className="font-mono text-[9px] text-zinc-400 shrink-0">{em.timestamp.split(' ')[0]}</span>
                </div>
                <h4 className="font-bold text-zinc-950 dark:text-white truncate">{em.subject}</h4>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 text-[11px] leading-relaxed">{em.body}</p>

                <div className="mt-2.5 pt-2 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-end">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteEmail(em.id); }}
                    className="text-[10px] text-zinc-400 hover:text-rose-500 font-mono"
                  >
                    Delete log
                  </button>
                </div>
              </div>
            ))}

            {filteredEmails.length === 0 && (
              <EmptyState 
                title="Mail list empty" 
                description={`No active dispatches processed in your ${activeTab} log directory.`} 
              />
            )}
          </div>
        </div>

        {/* Right Column: Immersive Email previewer panel */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 space-y-6 shadow-2xs">
          {selectedEmail ? (
            <>
              {/* Header details */}
              <div className="pb-4 border-b border-zinc-150 dark:border-zinc-850 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-2 py-0.5 rounded uppercase">
                    Sender: {selectedEmail.from}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">{selectedEmail.timestamp}</span>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-950 dark:text-white leading-snug">{selectedEmail.subject}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-1.5">
                    To Enclosure Recipient: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedEmail.to}</span>
                  </p>
                </div>
              </div>

              {/* Main Body */}
              <div className="text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed font-sans whitespace-pre-line p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-800">
                {selectedEmail.body}
              </div>

              {/* Secure dispatch signoffs */}
              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span>ASTRA CLINICAL ROUTE • DISPATCH LOG {selectedEmail.id}</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <Check size={12} /> ROUTE CONFIRMED
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-xs text-zinc-400 italic">
              Select a clinical email dispatch log.
            </div>
          )}
        </div>
      </div>

      {/* Compose Dispatch Modal */}
      <Modal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} title="Compose secure clinical mail dispatch">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          
          {/* Quick macro presets */}
          <div className="md:col-span-1 space-y-3 border-r border-zinc-150 dark:border-zinc-850 pr-4">
            <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Clinical Quick Macros</h4>
            {clinicalTemplates.map((temp, i) => (
              <button
                key={i}
                onClick={() => handleApplyTemplate(temp.body, temp.subject)}
                className="w-full p-2.5 rounded-lg border border-zinc-200 hover:border-purple-300 dark:border-zinc-800 dark:hover:border-purple-900 hover:bg-purple-500/5 text-left text-[11px] transition-all space-y-1 block"
              >
                <div className="font-bold text-zinc-800 dark:text-zinc-200">{temp.title}</div>
                <p className="text-zinc-400 line-clamp-2 leading-snug">{temp.body}</p>
              </button>
            ))}
          </div>

          {/* Form Composer */}
          <form onSubmit={handleSendEmail} className="md:col-span-2 space-y-4">
            <div className="space-y-1.5">
              <label className="block font-semibold">Recipient Contact *</label>
              <input
                type="email"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                placeholder="alexander.sterling@gmail.com"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold">Subject Context *</label>
              <input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Diagnostic blood screening panel findings review..."
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold">Message Body Context *</label>
              <textarea
                rows={6}
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Provide medical diagnostics context..."
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2 leading-relaxed"
                required
              />
            </div>

            <div className="pt-4 border-t border-zinc-250 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold flex items-center gap-1.5"
              >
                <Send size={13} />
                Send Secure Dispatch
              </button>
            </div>
          </form>
        </div>
      </Modal>

    </div>
  );
}
