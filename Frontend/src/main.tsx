import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { bootstrapSession } from './api/client';
import { loadStoredAuthUser, useAppStore } from './store/appStore';

bootstrapSession()
  .then((hasSession) => {
    if (!hasSession) {
      return;
    }

    const storedUser = loadStoredAuthUser();
    if (storedUser) {
      useAppStore.getState().restoreSession(storedUser);
    }
  })
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
