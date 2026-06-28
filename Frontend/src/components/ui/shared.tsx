import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, SlidersHorizontal, Calendar, ArrowLeft, X, 
  ChevronLeft, ChevronRight, Check, Pin, Bell, Trash2, 
  HelpCircle, Sparkles, CheckSquare, Plus, CornerDownLeft
} from 'lucide-react';

// 1. Page Header with Breadcrumbs & Pinned status
interface PageHeaderProps {
  title: string;
  description?: string;
  moduleName?: string;
  isPinned?: boolean;
  onTogglePin?: () => void;
  breadcrumbs: { label: string; active?: boolean }[];
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  moduleName,
  isPinned = false,
  onTogglePin,
  breadcrumbs,
  actions
}: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-2">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
        {breadcrumbs.map((bc, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span>/</span>}
            <span className={bc.active ? 'text-zinc-800 dark:text-zinc-200 font-medium' : ''}>
              {bc.label}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-sans">
              {title}
            </h1>
            {onTogglePin && (
              <button
                onClick={onTogglePin}
                title={isPinned ? 'Unpin module' : 'Pin module'}
                className={`p-1 rounded-md transition-colors duration-150 ${
                  isPinned 
                    ? 'text-amber-500 bg-amber-50/50 dark:bg-amber-950/20' 
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Pin size={15} className={isPinned ? 'fill-amber-500' : ''} />
              </button>
            )}
          </div>
          {description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl font-sans">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 self-start sm:self-center">{actions}</div>}
      </div>
    </div>
  );
}

// 2. Statistic Card (Stripe/Linear style)
interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  onClick?: () => void;
  accent?: string;
}

export function StatCard({ title, value, subtext, trend, icon, onClick, accent }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 ${
        onClick ? 'cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700' : ''
      }`}
    >
      {accent && (
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accent}`} />
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          {title}
        </span>
        {icon && <div className="text-zinc-400 dark:text-zinc-500">{icon}</div>}
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-sans">
          {value}
        </span>
        {trend && (
          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono font-medium ${
            trend.isPositive 
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
          }`}>
            {trend.value}
          </span>
        )}
      </div>
      {subtext && (
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-sans">
          {subtext}
        </p>
      )}
    </motion.div>
  );
}

// 3. Status Badge (Premium subtle layout)
export function StatusBadge({ status, type }: { status: string; type: 'success' | 'warning' | 'error' | 'info' | 'default' }) {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    default: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-mono font-medium ${styles[type]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

// 4. Modal (Radix & Vercel style)
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl z-10 text-zinc-900 dark:text-zinc-100"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// 5. Drawer (Flexible Filters drawer)
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs" 
            onClick={onClose} 
          />
          
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col"
            >
              <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white font-sans">{title}</h2>
                <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// 6. Sticky Note Widget
export function StickyNoteWidget({ notes, onAddNote, onDeleteNote }: { notes: string[], onAddNote: (note: string) => void, onDeleteNote: (idx: number) => void }) {
  const [newNote, setNewNote] = useState('');

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={12} className="text-yellow-500" />
          Clinical Sticky Notes
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 max-h-[140px] overflow-y-auto pr-1">
        {notes.map((note, i) => (
          <div key={i} className="relative group p-2.5 rounded-lg bg-amber-50/50 dark:bg-yellow-950/10 border border-yellow-200/50 dark:border-yellow-950/40 text-xs text-yellow-900 dark:text-amber-200 space-y-1">
            <p className="line-clamp-4">{note}</p>
            <button 
              onClick={() => onDeleteNote(i)}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 rounded transition-opacity"
            >
              <Trash2 size={10} />
            </button>
          </div>
        ))}
        {notes.length === 0 && (
          <div className="col-span-2 text-center py-6 text-xs text-zinc-400 dark:text-zinc-500 italic">
            No active notes pinned.
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input 
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Jot down quick diagnostics..."
          className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-700"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newNote.trim()) {
              onAddNote(newNote.trim());
              setNewNote('');
            }
          }}
        />
        <button 
          onClick={() => {
            if (newNote.trim()) {
              onAddNote(newNote.trim());
              setNewNote('');
            }
          }}
          className="p-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

// 7. Todo Widget
export function TodoWidget({ todos, onToggleTodo, onAddTodo, onDeleteTodo }: { todos: { text: string; done: boolean }[], onToggleTodo: (i: number) => void, onAddTodo: (text: string) => void, onDeleteTodo: (i: number) => void }) {
  const [newTodo, setNewTodo] = useState('');

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <CheckSquare size={12} className="text-emerald-500" />
          Shift Checklist
        </span>
      </div>
      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
        {todos.map((todo, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                checked={todo.done}
                onChange={() => onToggleTodo(i)}
                className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
              />
              <span className={`text-zinc-700 dark:text-zinc-300 ${todo.done ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}`}>
                {todo.text}
              </span>
            </div>
            <button onClick={() => onDeleteTodo(i)} className="text-zinc-400 hover:text-rose-500 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {todos.length === 0 && (
          <div className="text-center py-6 text-xs text-zinc-400 dark:text-zinc-500 italic">
            Checklist empty! Add a task.
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input 
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="e.g. Check patient CBC values..."
          className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-700"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newTodo.trim()) {
              onAddTodo(newTodo.trim());
              setNewTodo('');
            }
          }}
        />
        <button 
          onClick={() => {
            if (newTodo.trim()) {
              onAddTodo(newTodo.trim());
              setNewTodo('');
            }
          }}
          className="p-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

// 8. Empty state
export function EmptyState({ title, description, icon, action }: { title: string; description: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/10">
      {icon ? <div className="text-zinc-400 dark:text-zinc-600 mb-3">{icon}</div> : <HelpCircle size={36} className="text-zinc-300 dark:text-zinc-700 mb-3" />}
      <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">{title}</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// 9. Skeleton Loader
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 ${className}`} />
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-3.5 w-full">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
    </div>
  );
}

// 10. Centralized Timeline component
interface TimelineItem {
  date: string;
  title: string;
  category: string;
  details: string;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-3 pl-6 space-y-6">
      {items.map((item, idx) => (
        <div key={idx} className="relative">
          <div className="absolute -left-[31px] mt-1.5 h-3.5 w-3.5 rounded-full bg-zinc-900 dark:bg-white border-2 border-white dark:border-zinc-950" />
          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 block mb-1">
            {item.date}
          </span>
          <h4 className="text-xs font-semibold text-zinc-950 dark:text-white flex items-center gap-2">
            {item.title}
            <span className="px-1.5 py-0.5 rounded-sm bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono text-zinc-500">
              {item.category}
            </span>
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {item.details}
          </p>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-xs text-zinc-400 italic">No events logged in the clinical history.</p>
      )}
    </div>
  );
}

// 11. AI Quick Prompt Bar
export function AIQuickPromptBar({ onSubmit }: { onSubmit: (p: string) => void }) {
  const [prompt, setPrompt] = useState('');

  const suggestions = [
    'Analyze anemia reports',
    'Schedule card consultation',
    'GST Invoice audit',
    'Urgent care doctor rota'
  ];

  return (
    <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={13} className="text-purple-500 animate-pulse" />
          Integrated AI Quick Prompt
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask AI Agents (e.g. Evaluate PAT-8801 history and summarize...)"
          className="flex-1 min-w-0 rounded-lg px-3.5 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-hidden focus:border-purple-400 dark:focus:border-purple-900"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && prompt.trim()) {
              onSubmit(prompt);
              setPrompt('');
            }
          }}
        />
        <button
          onClick={() => {
            if (prompt.trim()) {
              onSubmit(prompt);
              setPrompt('');
            }
          }}
          className="p-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 flex items-center gap-1 text-xs font-medium"
        >
          <CornerDownLeft size={13} />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-zinc-400 font-mono">Suggestions:</span>
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSubmit(s)}
            className="text-[10px] font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-2 py-0.5 rounded-md transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
