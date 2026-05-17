
import { useCallback } from 'react';
import { exportApi } from '@/qms/lib/api-client';

export function useExport() {
  const downloadCsv = useCallback(async (url: string, filename?: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition');
      const suggestedName = disposition?.match(/filename="?([^"]+)"?/)?.[1];
      const finalName = filename || suggestedName || 'export.csv';

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = finalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, []);

  const exportAuditTrail = useCallback(() => {
    return downloadCsv('/api/export/audit-trail', `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`);
  }, [downloadCsv]);

  const exportEntity = useCallback((entity: string) => {
    return downloadCsv(`/api/export/${entity}`, `${entity}-${new Date().toISOString().slice(0, 10)}.csv`);
  }, [downloadCsv]);

  const exportManagementReview = useCallback(() => {
    return downloadCsv('/api/export/management-review', `management-review-${new Date().toISOString().slice(0, 10)}.html`);
  }, [downloadCsv]);

  return {
    exportAuditTrail,
    exportEntity,
    exportManagementReview,
  };
}
