import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { I18nProvider } from '@/lib/i18n';
import { QueryProvider } from '@/providers/QueryProvider';
import App from '@/App';
import '@/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <I18nProvider>
          <QueryProvider>
            <App />
          </QueryProvider>
        </I18nProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
