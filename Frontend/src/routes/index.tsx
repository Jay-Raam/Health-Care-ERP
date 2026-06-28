import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { ListSkeleton, DashboardSkeleton, EmailSkeleton, ChatSkeleton } from '../components/ui/LoadingSystem';
import { useAppStore } from '../store/appStore';

// Lazy loaded page components
const Auth = React.lazy(() => import('../pages/Auth'));
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const Patients = React.lazy(() => import('../pages/Patients'));
const Appointments = React.lazy(() => import('../pages/Appointments'));
const Doctors = React.lazy(() => import('../pages/Doctors'));
const LabReports = React.lazy(() => import('../pages/LabReports'));
const Billing = React.lazy(() => import('../pages/Billing'));
const AIChat = React.lazy(() => import('../pages/AIChat'));
const EmailCenter = React.lazy(() => import('../pages/EmailCenter'));
const AdminLogs = React.lazy(() => import('../pages/AdminLogs'));

// Protected route wrapper to redirect unauthorized clients
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const currentUser = useAppStore((state) => state.currentUser);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If role is PATIENT, only allow access to dashboard, patients, appointments, and AI chat
  if (currentUser?.role === 'PATIENT') {
    const allowedPaths = ['/dashboard', '/patients', '/appointments', '/ai-chat'];
    const currentPath = window.location.pathname;
    if (!allowedPaths.includes(currentPath)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

// Public route wrapper (redirects to dashboard if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-mono text-xs">Accessing clinical portal...</div>}>
          <Auth initialScreen="login" />
        </Suspense>
      </PublicRoute>
    )
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-mono text-xs">Accessing clinical portal...</div>}>
          <Auth initialScreen="register" />
        </Suspense>
      </PublicRoute>
    )
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<DashboardSkeleton />}>
            <Dashboard />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/patients',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<ListSkeleton />}>
            <Patients />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/appointments',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<ListSkeleton />}>
            <Appointments />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/doctors',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<ListSkeleton />}>
            <Doctors />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/lab-reports',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<ListSkeleton />}>
            <LabReports />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/billing',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<ListSkeleton />}>
            <Billing />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/ai-chat',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<ChatSkeleton />}>
            <AIChat />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/email-center',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<EmailSkeleton />}>
            <EmailCenter />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin-logs',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<ListSkeleton />}>
            <AdminLogs />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-3xl font-bold font-mono text-zinc-200">404</h1>
        <p className="text-xs text-zinc-500 mt-2">The clinical registry page could not be resolved.</p>
        <a href="/dashboard" className="mt-5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs hover:bg-zinc-800 transition-colors font-mono">
          Return to Dashboard
        </a>
      </div>
    )
  }
]);
