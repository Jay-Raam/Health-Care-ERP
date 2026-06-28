import React from 'react';
import { motion } from 'motion/react';

// ==========================================
// 1. STATS CARD SKELETON (Used in Dashboard)
// ==========================================
export function StatCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-3.5">
      <div className="h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full w-full animate-pulse absolute top-0 left-0" />
      <div className="flex items-center justify-between">
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-2/5 animate-pulse" />
        <div className="h-4 w-4 rounded bg-zinc-150 dark:bg-zinc-800 animate-pulse" />
      </div>
      <div className="flex items-baseline justify-between">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/2 animate-pulse" />
        <div className="h-5 bg-zinc-100 dark:bg-zinc-800/80 rounded w-12 animate-pulse" />
      </div>
      <div className="h-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-md w-3/4 animate-pulse" />
    </div>
  );
}

// ==========================================
// 2. DASHBOARD PAGE SKELETON
// ==========================================
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 font-sans">
      {/* Page Title Context bar Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 w-full md:w-1/2">
          <div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-2/3 animate-pulse" />
          <div className="h-3.5 bg-zinc-150 dark:bg-zinc-850 rounded-md w-11/12 animate-pulse" />
        </div>
        <div className="h-7 bg-zinc-100 dark:bg-zinc-850 border border-zinc-200/50 dark:border-zinc-800 rounded-lg w-32 animate-pulse" />
      </div>

      {/* 4 Stat Modules Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Core Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3 width) - Charts & Quick Access */}
        <div className="lg:col-span-2 space-y-6">
          {/* Svg area chart loading card */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1.5 w-1/3">
                <div className="h-3 bg-zinc-250 dark:bg-zinc-800 rounded w-3/4 animate-pulse" />
                <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-full animate-pulse" />
              </div>
              <div className="h-5 w-24 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
            </div>
            {/* Pulsing svg simulation background */}
            <div className="h-[200px] w-full rounded-lg bg-zinc-50 dark:bg-zinc-950/40 relative overflow-hidden flex flex-col justify-end p-4">
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <div className="w-11/12 h-1/2 border-b-2 border-dashed border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="flex justify-between w-full font-mono text-[9px] text-zinc-300 dark:text-zinc-700">
                <div className="h-2 w-6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-2 w-6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-2 w-6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-2 w-6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-2 w-6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-2 w-6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-2 w-6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Quick links skeleton */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4">
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/4 animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 flex flex-col items-start space-y-2">
                  <div className="h-5 w-5 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-3/4 animate-pulse" />
                  <div className="h-2 bg-zinc-150 dark:bg-zinc-850 rounded-md w-1/2 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column (1/3 width) - Sidebar Widgets */}
        <div className="space-y-6">
          {/* AI prompt bar skeleton */}
          <div className="rounded-xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 flex gap-2">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-850 rounded-lg flex-1 animate-pulse" />
            <div className="h-8 w-8 bg-zinc-300 dark:bg-zinc-700 rounded-lg animate-pulse" />
          </div>

          {/* Checklist Widget Skeleton */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4">
            <div className="flex justify-between">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-2/5 animate-pulse" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-12 animate-pulse" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-sm bg-zinc-200 dark:bg-zinc-800 animate-pulse shrink-0" />
                  <div className="h-3.5 bg-zinc-150 dark:bg-zinc-850 rounded-md flex-1 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Notes Widget Skeleton */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4">
            <div className="flex justify-between">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-2/5 animate-pulse" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-8 animate-pulse" />
            </div>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-150 dark:border-zinc-850 space-y-2">
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-full animate-pulse" />
                  <div className="h-3 bg-zinc-150 dark:bg-zinc-850 rounded-md w-4/5 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. DIRECTORY / LIST PAGE SKELETON
// ==========================================
export function ListSkeleton() {
  return (
    <div className="space-y-6 font-sans">
      {/* Page Header Skeleton */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center space-x-2 text-[10px] font-mono">
          <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <span>/</span>
          <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2 w-full sm:w-1/2">
            <div className="h-7 bg-zinc-250 dark:bg-zinc-850 rounded-lg w-1/2 animate-pulse" />
            <div className="h-3.5 bg-zinc-150 dark:bg-zinc-850 rounded-md w-4/5 animate-pulse" />
          </div>
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-28 animate-pulse" />
        </div>
      </div>

      {/* Filter / Actions Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 p-2.5 rounded-xl shadow-2xs">
        <div className="w-full sm:max-w-xs h-8 bg-zinc-50 dark:bg-zinc-950/40 rounded-lg border border-zinc-200 dark:border-zinc-850 animate-pulse" />
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="h-8 w-16 bg-zinc-50 dark:bg-zinc-950/40 rounded-lg border border-zinc-200 dark:border-zinc-850 animate-pulse" />
          <div className="h-8 w-24 bg-zinc-50 dark:bg-zinc-950/40 rounded-lg border border-zinc-200 dark:border-zinc-850 animate-pulse" />
        </div>
      </div>

      {/* Directory Split / Core Table Skeleton */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
                {[1, 2, 3, 4, 5].map((i) => (
                  <th key={i} className="px-4 py-3.5 text-left">
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16 animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((rowIdx) => (
                <tr key={rowIdx} className="border-b border-zinc-200/60 dark:border-zinc-800/60">
                  {/* Column 1 - Profile bubble + title */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-850 shrink-0 animate-pulse" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-28 animate-pulse" />
                        <div className="h-2.5 bg-zinc-150 dark:bg-zinc-850 rounded w-16 animate-pulse" />
                      </div>
                    </div>
                  </td>
                  {/* Column 2 - Details 1 */}
                  <td className="px-4 py-4">
                    <div className="space-y-1.5">
                      <div className="h-3 bg-zinc-150 dark:bg-zinc-850 rounded w-24 animate-pulse" />
                      <div className="h-2.5 bg-zinc-100 dark:bg-zinc-900 rounded w-12 animate-pulse" />
                    </div>
                  </td>
                  {/* Column 3 - Badge indicator */}
                  <td className="px-4 py-4">
                    <div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-20 animate-pulse" />
                  </td>
                  {/* Column 4 - Details 2 */}
                  <td className="px-4 py-4">
                    <div className="h-3 bg-zinc-150 dark:bg-zinc-850 rounded w-28 animate-pulse" />
                  </td>
                  {/* Column 5 - Actions */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-7 w-7 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg animate-pulse" />
                      <div className="h-7 w-7 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg animate-pulse" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer pagination skeleton */}
        <div className="px-4 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 flex items-center justify-between">
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-32 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-7 w-12 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg animate-pulse" />
            <div className="h-7 w-12 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. EMAIL CENTER SKELETON
// ==========================================
export function EmailSkeleton() {
  return (
    <div className="space-y-6 font-sans">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2 w-full sm:w-1/2">
          <div className="h-7 bg-zinc-250 dark:bg-zinc-850 rounded-lg w-1/3 animate-pulse" />
          <div className="h-3.5 bg-zinc-150 dark:bg-zinc-850 rounded-md w-4/5 animate-pulse" />
        </div>
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-28 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Mail list folder */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-1 bg-white dark:bg-zinc-900 p-1 border border-zinc-200/50 dark:border-zinc-800 rounded-lg animate-pulse">
            <div className="h-7 bg-zinc-150 dark:bg-zinc-800 rounded" />
            <div className="h-7 bg-zinc-100 dark:bg-zinc-850 rounded" />
            <div className="h-7 bg-zinc-100 dark:bg-zinc-850 rounded" />
          </div>

          <div className="h-8 bg-zinc-100 dark:bg-zinc-850 border border-zinc-200/60 dark:border-zinc-800 rounded-lg w-full animate-pulse" />

          {/* List items pulsing */}
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3.5 border border-zinc-200/60 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-1/2 animate-pulse" />
                  <div className="h-2 bg-zinc-150 dark:bg-zinc-900 rounded w-10 animate-pulse" />
                </div>
                <div className="h-3 bg-zinc-150 dark:bg-zinc-900 rounded w-3/4 animate-pulse" />
                <div className="h-2 bg-zinc-100 dark:bg-zinc-900/60 rounded w-11/12 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Preview Pane */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 space-y-6">
          <div className="flex items-start justify-between border-b border-zinc-150 dark:border-zinc-800 pb-5">
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-3 bg-zinc-150 dark:bg-zinc-850 rounded w-24 animate-pulse" />
                <div className="h-3 bg-zinc-100 dark:bg-zinc-900 rounded w-32 animate-pulse" />
              </div>
            </div>
            <div className="h-7 w-12 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          </div>

          <div className="space-y-3">
            <div className="h-3 bg-zinc-150 dark:bg-zinc-800 rounded w-full animate-pulse" />
            <div className="h-3 bg-zinc-150 dark:bg-zinc-800 rounded w-full animate-pulse" />
            <div className="h-3 bg-zinc-150 dark:bg-zinc-800 rounded w-5/6 animate-pulse" />
            <div className="h-3 bg-zinc-150 dark:bg-zinc-800 rounded w-11/12 animate-pulse" />
          </div>

          <div className="h-24 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-850 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. CHAT SYSTEM SKELETON
// ==========================================
export function ChatSkeleton() {
  return (
    <div className="flex h-[calc(100vh-140px)] border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/40 overflow-hidden font-sans">
      {/* Session list sidebar skeleton */}
      <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50/40 dark:bg-zinc-950/20 shrink-0 hidden md:flex">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-full animate-pulse" />
        </div>
        <div className="p-3 space-y-2 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-2.5 rounded-lg border border-transparent flex items-center gap-2">
              <div className="h-3.5 w-3.5 bg-zinc-200 dark:bg-zinc-850 rounded-full animate-pulse shrink-0" />
              <div className="h-3 bg-zinc-150 dark:bg-zinc-800 rounded w-3/4 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Main conversational chat skeleton */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950/10">
        <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 justify-between">
          <div className="space-y-1.5 w-1/3">
            <div className="h-3 bg-zinc-250 dark:bg-zinc-800 rounded w-1/2 animate-pulse" />
            <div className="h-2.5 bg-zinc-150 dark:bg-zinc-850 rounded w-2/3 animate-pulse" />
          </div>
          <div className="h-6 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-md animate-pulse" />
        </div>

        {/* Message feed skeleton with staggered boxes */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="flex items-start gap-2.5 max-w-xl">
            <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0 animate-pulse" />
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg rounded-tl-none flex-1 space-y-2 animate-pulse">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
              <div className="h-3 bg-zinc-150 dark:bg-zinc-850 rounded w-full" />
              <div className="h-2.5 bg-zinc-100 dark:bg-zinc-900 rounded w-1/2" />
            </div>
          </div>

          <div className="flex items-start gap-2.5 max-w-xl ml-auto justify-end">
            <div className="p-3 bg-zinc-900 dark:bg-white border border-transparent rounded-lg rounded-tr-none text-white max-w-md w-64 space-y-2 animate-pulse">
              <div className="h-3 bg-zinc-750 dark:bg-zinc-150 rounded w-full" />
              <div className="h-3 bg-zinc-700 dark:bg-zinc-200 rounded w-4/5" />
            </div>
            <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0 animate-pulse" />
          </div>

          <div className="flex items-start gap-2.5 max-w-xl">
            <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0 animate-pulse" />
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg rounded-tl-none flex-1 space-y-2 animate-pulse">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
              <div className="h-2 bg-zinc-150 dark:bg-zinc-850 rounded w-1/3" />
            </div>
          </div>
        </div>

        {/* Input box bottom bar */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 flex gap-2">
          <div className="h-9 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex-1 animate-pulse" />
          <div className="h-9 w-9 bg-zinc-900 dark:bg-white rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. CENTRAL LOADER SWITCH / WRAPPER
// ==========================================
interface CentralLoaderProps {
  mode: 'dashboard' | 'list' | 'email' | 'chat';
  children: React.ReactNode;
  isLoading?: boolean;
}

export function CentralLoader({ mode, children, isLoading = false }: CentralLoaderProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  // Display beautiful container entry animation
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full h-full"
    >
      {mode === 'dashboard' && <DashboardSkeleton />}
      {mode === 'list' && <ListSkeleton />}
      {mode === 'email' && <EmailSkeleton />}
      {mode === 'chat' && <ChatSkeleton />}
    </motion.div>
  );
}
