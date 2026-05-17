'use client';

import React from 'react';
import { I18nProvider } from '@/qms/lib/i18n';
import { AppLayout } from '@/qms/components/layout/AppLayout';

export default function QmsApp() {
  return (
    <I18nProvider>
      <AppLayout />
    </I18nProvider>
  );
}
