'use client';

import dynamic from 'next/dynamic';

const QmsApp = dynamic(() => import('@/qms/QmsApp'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading QMS SaaS Pro...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <QmsApp />;
}
