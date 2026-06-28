import React, { useState, useRef } from 'react';
import { useAppStore } from '@/src/store/appStore';
import { useUpload, useNotification } from '@/src/hooks/useApp';
import { PageHeader, StatusBadge, EmptyState } from '@/src/components/ui/shared';
import { 
  FileText, UploadCloud, Search, Trash2, Eye, Sparkles, 
  ArrowRight, Download, Activity, AlertTriangle, FileSpreadsheet, X 
} from 'lucide-react';

export default function LabReports() {
  const labReports = useAppStore((state) => state.labReports);
  const addLabReport = useAppStore((state) => state.addLabReport);
  const deleteLabReport = useAppStore((state) => state.deleteLabReport);
  const patients = useAppStore((state) => state.patients);
  const pins = useAppStore((state) => state.pins);
  const togglePin = useAppStore((state) => state.togglePin);

  const { triggerToast } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected report details state
  const [selectedRepId, setSelectedRepId] = useState<string>(labReports[0]?.id || '');
  const selectedReport = labReports.find(r => r.id === selectedRepId) || labReports[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Simulated AI Analyzer on completion of upload
  const handleScanUploadComplete = (finishedFile: { name: string; size: string; type: string }) => {
    // Generate simulated lab report
    const randomPatient = patients[Math.floor(Math.random() * patients.length)];
    const isCritical = finishedFile.name.toLowerCase().includes('critical') || Math.random() > 0.6;

    addLabReport({
      patientId: randomPatient?.id || 'PAT-8801',
      patientName: randomPatient?.name || 'Alexander Sterling',
      testName: finishedFile.name.split('.')[0].replace(/_/g, ' ') || 'Diagnostic Bio panel',
      category: 'Blood Work',
      status: isCritical ? 'Critical' : 'Completed',
      aiSummary: isCritical 
        ? 'CRITICAL ALERT: Blood biochemistry triggers abnormal lipid and cholesterol limits. The LDL cholesterol reads 195 mg/dL (Critical). Prompt prescription of HMG-CoA reductase inhibitors (statins) combined with cardio-consult is urgently advised.'
        : 'LAB REVIEW: Standard blood metabolic metrics indicate ideal ranges. Electrolytes (Sodium, Potassium, Chloride) reside within standard homeostatic limits. Glucose levels are stable.',
      indicators: [
        { name: 'LDL Cholesterol', value: isCritical ? '195 mg/dL' : '105 mg/dL', referenceRange: '< 100 mg/dL', status: isCritical ? 'High' : 'Normal' },
        { name: 'HDL Cholesterol', value: '45 mg/dL', referenceRange: '> 40 mg/dL', status: 'Normal' },
        { name: 'Serum Sodium', value: '141 mEq/L', referenceRange: '135 - 145 mEq/L', status: 'Normal' },
        { name: 'Fast Blood Glucose', value: '88 mg/dL', referenceRange: '70 - 100 mg/dL', status: 'Normal' }
      ]
    });
  };

  const { isUploading, progress, startUpload } = useUpload(handleScanUploadComplete);

  // Filter Logic
  const filteredReports = labReports.filter((rep) => {
    return rep.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           rep.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           rep.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Drag and Drop simulation
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      startUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      startUpload(files[0]);
    }
  };

  const handleDeleteReport = (id: string, name: string) => {
    if (confirm(`Purge lab report record ${name}? This action is irreversible.`)) {
      deleteLabReport(id);
      triggerToast('Lab Report Deleted', `Successfully deleted report: ${name}`, 'warning');
      if (selectedRepId === id) {
        setSelectedRepId('');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Page Header */}
      <PageHeader 
        title="Lab Reports Hub"
        description="Verify raw diagnostic hematology files, initiate instant drag-and-drop report parsing, and view AI-driven summaries."
        moduleName="Lab Reports"
        isPinned={pins.includes('Lab Reports')}
        onTogglePin={() => togglePin('Lab Reports')}
        breadcrumbs={[{ label: 'Laboratory' }, { label: 'Scanned Blood Panels', active: true }]}
      />

      {/* 2. Drag and Drop Zone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-7 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center space-y-2.5 ${
          isDragging 
            ? 'border-purple-500 bg-purple-500/5' 
            : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-white/50 dark:bg-zinc-900/40'
        }`}
      >
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg"
        />

        {isUploading ? (
          <div className="space-y-3 w-full max-w-xs py-2">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span className="animate-pulse">Security parsing file...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <div className="p-3 bg-purple-500/10 dark:bg-purple-950/20 rounded-full text-purple-600 dark:text-purple-400">
              <UploadCloud size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-950 dark:text-white">
                Drag & drop medical files here, or <span className="text-purple-500 underline">browse</span>
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-1">
                Supports PDF, DICOM scan files or JPG up to 25MB • HIPAA Safe
              </p>
            </div>
          </>
        )}
      </div>

      {/* 3. Core Workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Report Search list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by patient or test..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 focus:outline-hidden"
            />
          </div>

          <div className="space-y-2.5">
            {filteredReports.map((rep) => (
              <div
                key={rep.id}
                onClick={() => setSelectedRepId(rep.id)}
                className={`p-4 rounded-xl border cursor-pointer text-xs transition-all ${
                  selectedRepId === rep.id 
                    ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-50/50 dark:bg-zinc-900/30' 
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-750'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{rep.id}</span>
                  <StatusBadge 
                    status={rep.status} 
                    type={rep.status === 'Critical' ? 'error' : 'success'} 
                  />
                </div>
                <h4 className="font-bold text-zinc-950 dark:text-white">{rep.testName}</h4>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">Patient: <span className="font-semibold">{rep.patientName}</span></p>
                
                <div className="pt-2.5 mt-2.5 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>{rep.uploadedAt.split(' ')[0]}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteReport(rep.id, rep.testName); }}
                    className="text-zinc-400 hover:text-rose-500 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {filteredReports.length === 0 && (
              <EmptyState 
                title="No reports processed" 
                description="Upload medical blood files or try adjusting report search filters." 
              />
            )}
          </div>
        </div>

        {/* Right Column: Complete Report visualizers + AI Summaries */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-6 shadow-2xs">
          {selectedReport ? (
            <>
              {/* Report Header summary */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-zinc-150 dark:border-zinc-850">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded uppercase">
                    {selectedReport.category}
                  </span>
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white">{selectedReport.testName}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Patient: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedReport.patientName}</span> ({selectedReport.patientId})
                  </p>
                </div>
                <div className="flex sm:flex-col items-end gap-2 text-right">
                  <StatusBadge status={selectedReport.status} type={selectedReport.status === 'Critical' ? 'error' : 'success'} />
                  <span className="text-[10px] font-mono text-zinc-400 block mt-1">Uploaded: {selectedReport.uploadedAt}</span>
                </div>
              </div>

              {/* Glowing AI Medical Summary box */}
              {selectedReport.aiSummary && (
                <div className="relative overflow-hidden rounded-xl border border-purple-200/50 dark:border-purple-950/40 bg-purple-500/5 p-4 space-y-2">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-indigo-500" />
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-purple-500 animate-pulse" />
                    <span className="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      Integrated Lab AI Diagnostics Agent
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-purple-100 leading-relaxed font-sans mt-1.5 whitespace-pre-line">
                    {selectedReport.aiSummary}
                  </p>
                </div>
              )}

              {/* Indicator metrics table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-950 dark:text-white uppercase font-mono tracking-wider text-[10px] text-zinc-400 flex items-center gap-1.5">
                  <Activity size={14} className="text-zinc-400" />
                  Biochemical Diagnostic Indicators
                </h4>

                <div className="border border-zinc-150 dark:border-zinc-800 rounded-lg overflow-hidden text-xs font-mono shadow-2xs bg-zinc-50/50 dark:bg-zinc-900/10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-150 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/40 text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">
                        <th className="p-3.5">Indicator</th>
                        <th className="p-3.5">Recorded value</th>
                        <th className="p-3.5">Reference limits</th>
                        <th className="p-3.5 text-right">Biometric alert</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
                      {selectedReport.indicators.map((ind, i) => (
                        <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                          <td className="p-3.5 font-sans font-medium text-zinc-800 dark:text-zinc-200">{ind.name}</td>
                          <td className="p-3.5 font-bold text-zinc-950 dark:text-white">{ind.value}</td>
                          <td className="p-3.5 text-zinc-500 dark:text-zinc-400">{ind.referenceRange}</td>
                          <td className="p-3.5 text-right">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[9px] ${
                              ind.status === 'High' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                              ind.status === 'Low' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {ind.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Artifact actions */}
              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => alert('PDF artifact compilation started. A download link will trigger shortly.')}
                  className="px-3.5 py-2 border border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Download size={13} />
                  Download PDF Report
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-xs text-zinc-400 italic">
              Select or upload a blood metabolic report.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
