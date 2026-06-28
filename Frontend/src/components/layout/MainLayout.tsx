import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../../store/appStore';
import { useTheme, useKeyboardShortcut, useNotification } from '../../hooks/useApp';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, HeartPulse, TestTube2, 
  Receipt, MessageSquare, Mail, ShieldAlert, LogOut, 
  Menu, Bell, Moon, Sun, Pin, Search, Check, Trash2, X,
  User, CheckSquare, Settings, FileText, ChevronDown
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const pins = useAppStore((state) => state.pins);
  const togglePin = useAppStore((state) => state.togglePin);
  const currentUser = useAppStore((state) => state.currentUser);
  const logout = useAppStore((state) => state.logout);

  const getActiveTabFromPath = (path: string) => {
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/patients': return 'Patients';
      case '/appointments': return 'Appointments';
      case '/doctors': return 'Doctors';
      case '/lab-reports': return 'Lab Reports';
      case '/billing': return 'Billing';
      case '/ai-chat': return 'AI Chat';
      case '/email-center': return 'Email Center';
      case '/admin-logs': return 'Admin Logs';
      default: return 'Dashboard';
    }
  };

  const getTabPath = (tab: string) => {
    switch (tab) {
      case 'Dashboard': return '/dashboard';
      case 'Patients': return '/patients';
      case 'Appointments': return '/appointments';
      case 'Doctors': return '/doctors';
      case 'Lab Reports': return '/lab-reports';
      case 'Billing': return '/billing';
      case 'AI Chat': return '/ai-chat';
      case 'Email Center': return '/email-center';
      case 'Admin Logs': return '/admin-logs';
      default: return '/dashboard';
    }
  };

  const activeTab = getActiveTabFromPath(location.pathname);

  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clear } = useNotification();

  // Storage Modification Tamper Detection Security Guard
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-auth-user') {
        logout();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Active validation check every 1.5 seconds
    const interval = setInterval(() => {
      const saved = localStorage.getItem('app-auth-user');
      if (currentUser) {
        if (!saved) {
          logout();
        } else {
          try {
            const parsed = JSON.parse(saved);
            if (
              parsed.id !== currentUser.id || 
              parsed.role !== currentUser.role || 
              parsed.email !== currentUser.email
            ) {
              logout();
            }
          } catch {
            logout();
          }
        }
      } else if (saved) {
        logout();
      }
    }, 1500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [currentUser, logout]);

  // Search Dialog States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notification Panel State
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  // Profile Dropdown State
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Keyboard shortcut Ctrl + K
  useKeyboardShortcut(['ctrl', 'k'], (e) => {
    setIsSearchOpen(true);
  }, { preventDefault: true });

  // Sidebar Modules
  const navigationItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Patients', icon: <Users size={18} /> },
    { name: 'Appointments', icon: <Calendar size={18} /> },
    { name: 'Doctors', icon: <HeartPulse size={18} /> },
    { name: 'Lab Reports', icon: <TestTube2 size={18} /> },
    { name: 'Billing', icon: <Receipt size={18} /> },
    { name: 'AI Chat', icon: <MessageSquare size={18} /> },
    { name: 'Email Center', icon: <Mail size={18} /> },
    { name: 'Admin Logs', icon: <ShieldAlert size={18} /> }
  ];

  const isPatient = currentUser?.role === 'PATIENT';
  const filteredNavigationItems = navigationItems.filter(item => {
    if (isPatient) {
      return ['Dashboard', 'Patients', 'Appointments', 'AI Chat'].includes(item.name);
    }
    return true;
  });

  const handleModuleClick = (tabName: string) => {
    navigate(getTabPath(tabName));
    setIsProfileOpen(false);
    setIsNotiOpen(false);
  };

  const isCurrentTabPinned = pins.includes(activeTab);

  // Simulated Global Search Results
  const mockSearchDatabase = [
    { tab: 'Patients', title: 'Alexander Sterling (PAT-8801)', subtitle: 'Hypertension Patient' },
    { tab: 'Patients', title: 'Evelyn Montgomery (PAT-4212)', subtitle: 'Anemia Patient' },
    { tab: 'Patients', title: 'Marcus Vance (PAT-3011)', subtitle: 'Diabetes Patient' },
    { tab: 'Doctors', title: 'Dr. Sarah Connor', subtitle: 'Cardiologist Specialist' },
    { tab: 'Doctors', title: 'Dr. Helen Cho', subtitle: 'Lab & Diagnostic Chief' },
    { tab: 'Lab Reports', title: 'Blood Work Panel Review (LAB-201)', subtitle: 'Anemia analysis report' },
    { tab: 'Billing', title: 'Invoice INV-3011', subtitle: 'Paid Cardiovascular charges' },
    { tab: 'Billing', title: 'Invoice INV-3012', subtitle: 'Pending Blood screening balance' }
  ];

  const filteredSearchResults = searchQuery 
    ? mockSearchDatabase.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tab.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockSearchDatabase.slice(0, 4); // Show recent suggestions by default

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* 1. Global Search Dialog (Modal) */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-xs" 
              onClick={() => setIsSearchOpen(false)} 
            />
            
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center gap-2 px-3 border-b border-zinc-200 dark:border-zinc-800">
                <Search className="text-zinc-400 dark:text-zinc-500" size={18} />
                <input
                  autoFocus
                  placeholder="Search patients, doctors, files... (Ctrl + K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3.5 bg-transparent border-0 outline-hidden text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400"
                />
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 text-xs text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 font-mono"
                >
                  ESC
                </button>
              </div>

              {/* Suggestions / Results */}
              <div className="max-h-[300px] overflow-y-auto p-2 space-y-1 bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="px-2 py-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  {searchQuery ? 'Matches Found' : 'Recent Suggestions'}
                </div>
                {filteredSearchResults.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      handleModuleClick(res.tab);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2.5 rounded-lg flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{res.title}</div>
                      <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{res.subtitle}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-200/50 dark:bg-zinc-800 text-[10px] font-mono font-medium text-zinc-600 dark:text-zinc-400 capitalize">
                      {res.tab}
                    </span>
                  </button>
                ))}
                {filteredSearchResults.length === 0 && (
                  <div className="text-center py-6 text-xs text-zinc-400 dark:text-zinc-500">
                    No clinical logs matching "{searchQuery}"
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 relative overflow-hidden">
        
        {/* 2. Desktop Sidebar */}
        <aside className={`hidden lg:flex flex-col border-r border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-all duration-300 z-30 ${isSidebarOpen ? 'w-64' : 'w-[72px]'}`}>
          <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-1.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-xs">
                <HeartPulse size={18} />
              </div>
              {isSidebarOpen && (
                <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white truncate font-mono">
                  ASTRA CLINICAL
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            
            {/* Pinned modules folder */}
            {isSidebarOpen && pins.length > 0 && (
              <div className="space-y-1.5">
                <span className="px-3 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Pin size={11} className="text-amber-500 fill-amber-500" />
                  Pinned Access
                </span>
                <div className="space-y-0.5">
                  {pins.map((pinName) => {
                    const nav = navigationItems.find(n => n.name === pinName);
                    if (!nav) return null;
                    return (
                      <button
                        key={pinName}
                        onClick={() => handleModuleClick(pinName)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                          activeTab === pinName 
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold' 
                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        {nav.icon}
                        <span className="truncate">{pinName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Core directory folders */}
            <div className="space-y-1.5">
              {isSidebarOpen && (
                <span className="px-3 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Core Operations
                </span>
              )}
              <nav className="space-y-0.5">
                {filteredNavigationItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleModuleClick(item.name)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                      activeTab === item.name 
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold' 
                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <div className={activeTab === item.name ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}>
                      {item.icon}
                    </div>
                    {isSidebarOpen && <span className="truncate">{item.name}</span>}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Quick status anchor */}
          {isSidebarOpen && (
            <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 space-y-1">
              <div className="flex items-center justify-between">
                <span>System Health</span>
                <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <div className="text-[9px] text-zinc-400/80 dark:text-zinc-500/80">Container Build: v4.1.14 (3000)</div>
            </div>
          )}
        </aside>

        {/* 3. Main Workspace Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Header */}
          <header className="h-16 border-b border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 relative z-20">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="hidden lg:block p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
              >
                <Menu size={18} />
              </button>
              
              {/* App logo on mobile */}
              <div className="flex lg:hidden items-center gap-2">
                <div className="p-1.5 rounded-md bg-zinc-950 dark:bg-white text-white dark:text-zinc-950">
                  <HeartPulse size={16} />
                </div>
                <span className="text-xs font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
                  ASTRA
                </span>
              </div>

              {/* Global search trigger bar */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 w-48 lg:w-64 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 text-left text-xs text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
              >
                <Search size={14} />
                <span>Search clinical records...</span>
                <span className="ml-auto text-[9px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-800 px-1 rounded-sm">
                  ⌘K
                </span>
              </button>
            </div>

            {/* Header Toolbar Icons */}
            <div className="flex items-center gap-2.5 relative">
              
              {/* Pin shortcut */}
              <button
                onClick={() => togglePin(activeTab)}
                title={isCurrentTabPinned ? 'Unpin this module' : 'Pin this module'}
                className={`p-2 rounded-lg border transition-all duration-150 ${
                  isCurrentTabPinned 
                    ? 'border-amber-200 dark:border-amber-950/40 bg-amber-500/10 text-amber-500' 
                    : 'border-zinc-200/50 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400'
                }`}
              >
                <Pin size={15} className={isCurrentTabPinned ? 'fill-amber-500' : ''} />
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title="Toggle visual style"
                className="p-2 rounded-lg border border-zinc-200/50 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 transition-all"
              >
                {theme === 'dark' ? <Sun size={15} className="text-yellow-500" /> : <Moon size={15} />}
              </button>

              {/* Live Alerts / In-app Notifications */}
              <div className="relative">
                <button
                  onClick={() => setIsNotiOpen(!isNotiOpen)}
                  className={`p-2 rounded-lg border border-zinc-200/50 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 transition-all ${isNotiOpen ? 'bg-zinc-100 dark:bg-zinc-900' : ''}`}
                >
                  <Bell size={15} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 text-[10px] font-mono text-white rounded-full flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Drawer Dropdown */}
                <AnimatePresence>
                  {isNotiOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden z-50 text-xs"
                    >
                      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/20">
                        <span className="font-bold">Realtime Notifications</span>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-[10px] text-zinc-500 hover:text-zinc-800 dark:hover:text-white font-semibold">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-[250px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                        {notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.module) handleModuleClick(n.module);
                              setIsNotiOpen(false);
                            }}
                            className={`p-3 text-left transition-colors cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${!n.read ? 'bg-zinc-50/50 dark:bg-zinc-900/30 font-medium' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-mono font-bold capitalize ${
                                n.type === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                                n.type === 'success' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
                              }`}>
                                {n.module}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-400">{n.timestamp.split(' ')[1]} {n.timestamp.split(' ')[2]}</span>
                            </div>
                            <p className="mt-1.5 text-zinc-700 dark:text-zinc-300 line-clamp-2">{n.message}</p>
                          </div>
                        ))}
                        {notifications.length === 0 && (
                          <div className="p-6 text-center text-zinc-400 italic">
                            No notifications.
                          </div>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-2.5 border-t border-zinc-200 dark:border-zinc-800 text-center bg-zinc-50/50 dark:bg-zinc-900/20">
                          <button 
                            onClick={clear}
                            className="text-[10px] text-rose-500 hover:text-rose-600 dark:text-rose-400 font-mono font-medium flex items-center justify-center gap-1.5 w-full"
                          >
                            <Trash2 size={11} /> Clear notification cache
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 rounded-full border border-zinc-200/50 dark:border-zinc-800 p-1 bg-zinc-100 dark:bg-zinc-900 text-left hover:opacity-90"
                >
                  <img
                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=120'}
                    alt="avatar"
                    className="h-7 w-7 rounded-full object-cover"
                  />
                  <ChevronDown size={14} className="text-zinc-400 pr-1 hidden sm:block" />
                </button>

                {/* Profile panel */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden z-50 text-xs"
                    >
                      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="font-semibold text-zinc-900 dark:text-white">{currentUser?.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{currentUser?.email}</div>
                        <div className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-400 font-medium border border-zinc-200/30 dark:border-zinc-800">
                          Role: {currentUser?.role}
                        </div>
                      </div>
                      <div className="p-1 space-y-0.5">
                        <button 
                          onClick={() => handleModuleClick('Dashboard')}
                          className="w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2 transition-all"
                        >
                          <User size={14} className="text-zinc-400" />
                          <span>Clinician Account</span>
                        </button>
                        <button 
                          onClick={() => handleModuleClick('Admin Logs')}
                          className="w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2 transition-all"
                        >
                          <Settings size={14} className="text-zinc-400" />
                          <span>System Diagnostics</span>
                        </button>
                      </div>
                      <div className="p-1 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                          onClick={() => {
                            logout();
                            setIsProfileOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 rounded-lg flex items-center gap-2 transition-all"
                        >
                          <LogOut size={14} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* Core Content Window */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
            {children}
          </main>

          {/* Footer details */}
          <footer className="h-10 border-t border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 hidden md:flex items-center justify-between text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
            <div>ASTRA HEALTH • SECURE DIGITAL INFRASTRUCTURE</div>
            <div>HIPAA COMPLIANT • END-TO-END JWT ENCRYPTED</div>
          </footer>
        </div>
      </div>

      {/* 4. Mobile Bottom Navigation bar */}
      <nav className="lg:hidden h-14 border-t border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-around px-2 z-30">
        <button 
          onClick={() => handleModuleClick('Dashboard')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all ${activeTab === 'Dashboard' ? 'text-zinc-950 dark:text-white' : 'text-zinc-400'}`}
        >
          <LayoutDashboard size={16} />
          <span>Home</span>
        </button>
        <button 
          onClick={() => handleModuleClick('Patients')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all ${activeTab === 'Patients' ? 'text-zinc-950 dark:text-white' : 'text-zinc-400'}`}
        >
          <Users size={16} />
          <span>Patients</span>
        </button>
        <button 
          onClick={() => handleModuleClick('Appointments')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all ${activeTab === 'Appointments' ? 'text-zinc-950 dark:text-white' : 'text-zinc-400'}`}
        >
          <Calendar size={16} />
          <span>Schedules</span>
        </button>
        <button 
          onClick={() => handleModuleClick('AI Chat')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all ${activeTab === 'AI Chat' ? 'text-zinc-950 dark:text-white' : 'text-zinc-400'}`}
        >
          <MessageSquare size={16} />
          <span>AI Chat</span>
        </button>
        {!isPatient && (
          <button 
            onClick={() => handleModuleClick('Billing')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all ${activeTab === 'Billing' ? 'text-zinc-950 dark:text-white' : 'text-zinc-400'}`}
          >
            <Receipt size={16} />
            <span>Billing</span>
          </button>
        )}
      </nav>
    </div>
  );
}
