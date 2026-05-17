// Typed API client for all QMS entities
// Uses a factory pattern to generate CRUD API functions

import type {
  Document, Capa, NonConformance, Audit, Training, Risk,
  BatchRecord, Supplier, FormTemplate, FormInstance,
  AuditTrail, ChangeControl, Deviation, Profile, Organization,
} from '@/qms/types/qms';

// ---------------------------------------------------------------------------
// Generic response types
// ---------------------------------------------------------------------------

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
export type ApiListResponse<T> = ApiPaginatedResponse<T> | ApiErrorResponse;

// ---------------------------------------------------------------------------
// Generic fetch helper
// ---------------------------------------------------------------------------

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `API error: ${res.status}`);
  }

  // For CSV / HTML export responses, the API returns text instead of JSON.
  // We cast through unknown because the generic T is expected to be string
  // for these endpoints, but we need to satisfy the type system.
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/csv') || contentType.includes('text/html')) {
    const text = await res.text();
    return text as unknown as T;
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// CRUD API factory
// ---------------------------------------------------------------------------

export interface CrudApi<T> {
  list: (params?: Record<string, string>) => Promise<ApiListResponse<T>>;
  getById: (id: string) => Promise<ApiResponse<T>>;
  create: (data: Partial<T>) => Promise<ApiResponse<T>>;
  update: (id: string, data: Partial<T>) => Promise<ApiResponse<T>>;
  delete: (id: string) => Promise<ApiResponse<{ deleted: boolean }>>;
}

export function createCrudApi<T>(basePath: string): CrudApi<T> {
  return {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<ApiListResponse<T>>(`${basePath}${query}`);
    },

    getById: (id: string) =>
      apiFetch<ApiResponse<T>>(`${basePath}/${id}`),

    create: (data: Partial<T>) =>
      apiFetch<ApiResponse<T>>(basePath, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<T>) =>
      apiFetch<ApiResponse<T>>(`${basePath}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiFetch<ApiResponse<{ deleted: boolean }>>(`${basePath}/${id}`, {
        method: 'DELETE',
      }),
  };
}

// ---------------------------------------------------------------------------
// Entity-specific API instances
// ---------------------------------------------------------------------------

export const documentsApi = createCrudApi<Document>('/api/documents');
export const capasApi = createCrudApi<Capa>('/api/capas');
export const ncrsApi = createCrudApi<NonConformance>('/api/ncrs');
export const auditsApi = createCrudApi<Audit>('/api/audits');
export const trainingApi = createCrudApi<Training>('/api/training');
export const risksApi = createCrudApi<Risk>('/api/risks');
export const batchRecordsApi = createCrudApi<BatchRecord>('/api/batch-records');
export const suppliersApi = createCrudApi<Supplier>('/api/suppliers');
export const changeControlsApi = createCrudApi<ChangeControl>('/api/change-controls');
export const deviationsApi = createCrudApi<Deviation>('/api/deviations');

// ---------------------------------------------------------------------------
// Form APIs (templates + instances)
// ---------------------------------------------------------------------------

export const formTemplatesApi = createCrudApi<FormTemplate>('/api/forms/templates');
export const formInstancesApi = createCrudApi<FormInstance>('/api/forms/instances');

// ---------------------------------------------------------------------------
// Special APIs
// ---------------------------------------------------------------------------

export const auditTrailApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<ApiListResponse<AuditTrail>>(`/api/audit-trail${query}`);
  },
};

export const profilesApi = {
  list: () => apiFetch<ApiResponse<Profile[]>>('/api/profiles'),
  create: (data: Partial<Profile>) =>
    apiFetch<ApiResponse<Profile>>('/api/profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const organizationsApi = {
  list: () => apiFetch<ApiResponse<Organization[]>>('/api/organizations'),
  create: (data: Partial<Organization>) =>
    apiFetch<ApiResponse<Organization>>('/api/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ---------------------------------------------------------------------------
// Export APIs
// ---------------------------------------------------------------------------

export const exportApi = {
  auditTrail: () => apiFetch<string>('/api/export/audit-trail'),
  entity: (entity: string) => apiFetch<string>(`/api/export/${entity}`),
  managementReview: () => apiFetch<string>('/api/export/management-review'),
};
