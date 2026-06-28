import React, { useState } from 'react';
import { useAppStore } from '@/src/store/appStore';
import { usePagination, useNotification } from '@/src/hooks/useApp';
import { PageHeader, StatusBadge, EmptyState } from '@/src/components/ui/shared';
import { 
  ShieldAlert, Database, RotateCw, CheckCircle2, AlertTriangle, 
  Search, SlidersHorizontal, Trash2, Cpu, HardDrive, Key, UserCheck,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function AdminLogs() {
  const auditLogs = useAppStore((state) => state.auditLogs);
  const addAuditLog = useAppStore((state) => state.addAuditLog);
  const pins = useAppStore((state) => state.pins);
  const togglePin = useAppStore((state) => state.togglePin);

  const { triggerToast } = useNotification();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Active Audit Filter
  const filteredLogs = auditLogs.filter((log) => {
    return log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
           log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
           log.module.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const {
    currentPage,
    totalPages,
    paginatedItems,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage
  } = usePagination(filteredLogs, 5);

  const handleTriggerBackup = () => {
    setIsSyncing(true);
    triggerToast('Backup Sync Initialized', 'Packaging database journals and HIPAA audits...', 'info');

    setTimeout(() => {
      setIsSyncing(false);
      addAuditLog('Central clinical database backup generated successfully', 'System', 'Success');
      triggerToast('Secure Backup Generated', 'Backup safely written to primary Cloud Storage blocks.', 'success');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <PageHeader 
        title="Admin Diagnostics & Auditing"
        description="Verify HIPAA audit compliance records, track user operation trails, and execute real-time database backups."
        moduleName="Admin Logs"
        isPinned={pins.includes('Admin Logs')}
        onTogglePin={() => togglePin('Admin Logs')}
        breadcrumbs={[{ label: 'Administration' }, { label: 'Diagnostics Ledger', active: true }]}
      />

      {/* Grid: Server status meters & Audit list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Server Health status Gauges */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Container Diagnostics
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 space-y-1.5 text-xs font-mono">
              <Cpu className="text-zinc-400" size={16} />
              <div className="text-zinc-400 dark:text-zinc-500 text-[9px] uppercase font-bold">VCPUs usage</div>
              <div className="text-lg font-bold text-zinc-950 dark:text-white">24%</div>
            </div>

            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 space-y-1.5 text-xs font-mono">
              <HardDrive className="text-zinc-400" size={16} />
              <div className="text-zinc-400 dark:text-zinc-500 text-[9px] uppercase font-bold">Storage volume</div>
              <div className="text-lg font-bold text-zinc-950 dark:text-white">3.2 GB</div>
            </div>

            <div className="col-span-2 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-[9px] text-zinc-400 dark:text-zinc-500 uppercase font-bold">
                <span>Clinician database status</span>
                <span className="text-emerald-500 font-bold">ONLINE</span>
              </div>
              <div className="text-lg font-bold text-zinc-950 dark:text-white flex items-center justify-between">
                <span>0 Active Locks</span>
                <span className="text-xs text-zinc-400 font-normal">Active connections: 4</span>
              </div>
            </div>
          </div>

          {/* Backup executor */}
          <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-200/40 dark:border-purple-950/40 space-y-3.5 text-xs">
            <div>
              <h4 className="font-bold text-purple-950 dark:text-purple-300">Trigger Central Backup</h4>
              <p className="text-zinc-500 dark:text-purple-100/70 mt-1 leading-normal text-[11px]">
                Create a point-in-time, full database ledger snapshot. Files are encrypted with AES-256 for HIPAA compliance.
              </p>
            </div>

            <button
              onClick={handleTriggerBackup}
              disabled={isSyncing}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-semibold text-center rounded-lg transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing snaps...' : 'Sync Database Backup'}
            </button>
          </div>
        </div>

        {/* Right Columns: Central Audit Logs list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 p-2.5 rounded-xl shadow-2xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit trail modules or actions..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 font-mono text-[9px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Operational User</th>
                    <th className="p-4">Action Context Details</th>
                    <th className="p-4">Module</th>
                    <th className="p-4 text-right">Biometric IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                  {paginatedItems.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                      <td className="p-4 text-zinc-400 text-[10px] whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">{log.username}</td>
                      <td className="p-4 font-sans text-xs text-zinc-850 dark:text-zinc-200 leading-normal max-w-sm">
                        {log.action}
                      </td>
                      <td className="p-4">
                        <span className="px-1.5 py-0.5 rounded-sm bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold text-zinc-500 uppercase">
                          {log.module}
                        </span>
                      </td>
                      <td className="p-4 text-right text-zinc-400 text-[10px]">{log.ipAddress}</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <EmptyState 
                          title="No audit logs matched" 
                          description="Review searching criteria or expand operational checks." 
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span>Page {currentPage} of {totalPages}</span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={!hasPrevPage}
                    onClick={prevPage}
                    className="p-1 disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    disabled={!hasNextPage}
                    onClick={nextPage}
                    className="p-1 disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
