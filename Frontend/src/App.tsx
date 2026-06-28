import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from './store/appStore';
import { QueryProvider } from './providers/QueryProvider';

export default function App() {
  const theme = useAppStore((state) => state.theme);

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryProvider>
      {/* Premium Toast alerts manager */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#fafafa',
            fontSize: '11px',
            fontFamily: 'monospace',
            borderRadius: '10px',
            border: '1px solid #27272a'
          }
        }}
      />
      <RouterProvider router={router} />
    </QueryProvider>
  );
}
