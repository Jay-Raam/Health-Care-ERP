import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { toast } from 'react-hot-toast';

// 1. useAuth Hook
export function useAuth() {
  const currentUser = useAppStore((state) => state.currentUser);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const login = useAppStore((state) => state.login);
  const logout = useAppStore((state) => state.logout);
  const updateProfile = useAppStore((state) => state.updateProfile);

  return {
    user: currentUser,
    isAuthenticated,
    login,
    logout,
    updateProfile,
    isAdmin: currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOSPITAL_ADMIN',
    isDoctor: currentUser?.role === 'DOCTOR'
  };
}

// 2. useTheme Hook
export function useTheme() {
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  return { theme, toggleTheme, isDark: theme === 'dark' };
}

// 3. useDebounce Hook
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 4. useKeyboardShortcut Hook
export function useKeyboardShortcut(
  keys: string[],
  callback: (e: KeyboardEvent) => void,
  options: { preventDefault?: boolean } = {}
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const match = keys.every((key) => {
        if (key.toLowerCase() === 'ctrl' || key.toLowerCase() === 'control') return e.ctrlKey || e.metaKey;
        if (key.toLowerCase() === 'alt') return e.altKey;
        if (key.toLowerCase() === 'shift') return e.shiftKey;
        return e.key.toLowerCase() === key.toLowerCase();
      });

      if (match) {
        if (options.preventDefault) {
          e.preventDefault();
        }
        callback(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keys, callback, options]);
}

// 5. usePagination Hook
export function usePagination<T>(items: T[], initialPageSize = 5) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginatedItems = items.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const goToPage = (page: number) => {
    const safePage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(safePage);
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    setPageSize,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
}

// 6. useLocalStorage Hook
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(error);
    }
  };

  return [storedValue, setValue];
}

// 7. useUpload Hook (Simulates secure upload file loading / virus checks / AI scans)
export function useUpload(onComplete?: (file: { name: string; size: string; type: string }) => void) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; type: string } | null>(null);

  const startUpload = useCallback((file: File) => {
    setIsUploading(true);
    setProgress(0);
    setUploadedFile(null);

    const totalSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const typeStr = file.name.endsWith('.pdf') ? 'PDF' : 'Image';

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          const finishedFile = { name: file.name, size: totalSize, type: typeStr };
          setUploadedFile(finishedFile);
          toast.success(`Securely analyzed & uploaded: ${file.name}`);
          if (onComplete) onComplete(finishedFile);
          return 100;
        }
        return prev + 25; // Simulate fast chunks
      });
    }, 400);
  }, [onComplete]);

  return { isUploading, progress, uploadedFile, startUpload };
}

// 8. useNotification Hook
export function useNotification() {
  const notifications = useAppStore((state) => state.notifications);
  const addNotification = useAppStore((state) => state.addNotification);
  const markAsRead = useAppStore((state) => state.markNotificationAsRead);
  const markAllAsRead = useAppStore((state) => state.markAllNotificationsAsRead);
  const clear = useAppStore((state) => state.clearNotifications);

  const triggerToast = useCallback((title: string, msg: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    addNotification({ title, message: msg, type, module: 'System' });
    if (type === 'success') toast.success(`${title}: ${msg}`);
    else if (type === 'error') toast.error(`${title}: ${msg}`);
    else toast(`${title} - ${msg}`, { icon: '🔔' });
  }, [addNotification]);

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    addNotification,
    markAsRead,
    markAllAsRead,
    clear,
    triggerToast
  };
}
