import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createCrudApi,
  documentsApi,
  capasApi,
  ncrsApi,
  auditsApi,
  trainingApi,
  risksApi,
  batchRecordsApi,
  suppliersApi,
  changeControlsApi,
  deviationsApi,
  formTemplatesApi,
  formInstancesApi,
  auditTrailApi,
  profilesApi,
  organizationsApi,
  exportApi,
  type CrudApi,
  type ApiSuccessResponse,
  type ApiPaginatedResponse,
  type ApiErrorResponse,
  type ApiResponse,
  type ApiListResponse,
} from '@/lib/api-client';
import type { Document } from '@/types/qms';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal Response-like object that fetch mocks return. */
function mockResponse({
  ok = true,
  status = 200,
  statusText = 'OK',
  body = {},
  contentType = 'application/json',
}: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  body?: unknown;
  contentType?: string;
} = {}): Response {
  const headers = new Headers({ 'content-type': contentType });

  let bodyString: string;
  if (typeof body === 'string') {
    bodyString = body;
  } else {
    bodyString = JSON.stringify(body);
  }

  return {
    ok,
    status,
    statusText,
    headers,
    json: vi.fn().mockImplementation(() => {
      if (typeof body === 'string') {
        return Promise.resolve(JSON.parse(body));
      }
      return Promise.resolve(body);
    }),
    text: vi.fn().mockResolvedValue(bodyString),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('api-client', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. createCrudApi() factory — shape
  // =========================================================================

  describe('createCrudApi() factory', () => {
    it('returns an object with list, getById, create, update, delete methods', () => {
      const api = createCrudApi<Document>('/api/test');

      expect(api).toHaveProperty('list');
      expect(api).toHaveProperty('getById');
      expect(api).toHaveProperty('create');
      expect(api).toHaveProperty('update');
      expect(api).toHaveProperty('delete');

      expect(typeof api.list).toBe('function');
      expect(typeof api.getById).toBe('function');
      expect(typeof api.create).toBe('function');
      expect(typeof api.update).toBe('function');
      expect(typeof api.delete).toBe('function');
    });

    it('returns distinct function references for each method', () => {
      const api = createCrudApi<Document>('/api/test');

      expect(api.list).not.toBe(api.getById);
      expect(api.create).not.toBe(api.update);
      expect(api.update).not.toBe(api.delete);
    });

    it('different factory calls produce independent API objects', () => {
      const api1 = createCrudApi<Document>('/api/one');
      const api2 = createCrudApi<Document>('/api/two');

      expect(api1).not.toBe(api2);
      expect(api1.list).not.toBe(api2.list);
    });
  });

  // =========================================================================
  // 2. apiFetch behavior (tested indirectly through CRUD API)
  // =========================================================================

  describe('apiFetch behavior (indirect)', () => {
    const api = createCrudApi<Document>('/api/docs');

    it('successful JSON response — returns parsed data', async () => {
      const payload: ApiPaginatedResponse<Document> = {
        success: true,
        data: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      };
      fetchSpy.mockResolvedValue(mockResponse({ body: payload }));

      const result = await api.list();
      expect(result).toEqual(payload);
    });

    it('non-OK response — throws error with message from response body', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          body: { error: 'Invalid parameter' },
        }),
      );

      await expect(api.list()).rejects.toThrow('Invalid parameter');
    });

    it('non-OK response with unparseable body — falls back to statusText', async () => {
      const res = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
        text: vi.fn().mockResolvedValue('Internal Server Error'),
      } as unknown as Response;

      fetchSpy.mockResolvedValue(res);

      await expect(api.list()).rejects.toThrow('Internal Server Error');
    });

    it('non-OK response with no error field — falls back to generic message', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 422,
          statusText: 'Unprocessable Entity',
          body: { message: 'something' }, // no "error" key
        }),
      );

      await expect(api.list()).rejects.toThrow('API error: 422');
    });

    it('CSV content-type — returns text instead of JSON', async () => {
      const csvText = 'id,title\n1,Test';
      fetchSpy.mockResolvedValue(
        mockResponse({
          body: csvText,
          contentType: 'text/csv',
        }),
      );

      // Use getById so we get an ApiResponse<T> which we can cast to string via text path
      const result = await api.getById('export-csv');
      expect(result).toBe(csvText);
    });

    it('HTML content-type — returns text instead of JSON', async () => {
      const htmlText = '<html><body>Report</body></html>';
      fetchSpy.mockResolvedValue(
        mockResponse({
          body: htmlText,
          contentType: 'text/html',
        }),
      );

      const result = await api.getById('export-html');
      expect(result).toBe(htmlText);
    });
  });

  // =========================================================================
  // 3. CRUD methods — fetch call details
  // =========================================================================

  describe('CRUD methods', () => {
    const api = createCrudApi<Document>('/api/documents');

    beforeEach(() => {
      fetchSpy.mockResolvedValue(
        mockResponse({
          body: { success: true, data: {} },
        }),
      );
    });

    // ---- list() ----

    describe('list()', () => {
      it('calls fetch with the correct base URL (no params)', async () => {
        await api.list();

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit | undefined];
        expect(url).toBe('/api/documents');
        // list is GET — no method should be specified (default)
        expect(options?.method).toBeUndefined();
      });

      it('appends query params to the URL', async () => {
        await api.list({ status: 'Draft', department: 'QA' });

        const [url] = fetchSpy.mock.calls[0] as [string];
        expect(url).toContain('/api/documents?');
        expect(url).toContain('status=Draft');
        expect(url).toContain('department=QA');
      });

      it('sends Content-Type header as application/json', async () => {
        await api.list();

        const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit | undefined];
        expect(options?.headers).toBeDefined();
        const headers = options!.headers as Record<string, string>;
        expect(headers['Content-Type']).toBe('application/json');
      });
    });

    // ---- getById() ----

    describe('getById()', () => {
      it('calls fetch with ${basePath}/${id}', async () => {
        await api.getById('doc-123');

        const [url] = fetchSpy.mock.calls[0] as [string];
        expect(url).toBe('/api/documents/doc-123');
      });

      it('does not set a method (defaults to GET)', async () => {
        await api.getById('doc-456');

        const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit | undefined];
        expect(options?.method).toBeUndefined();
      });
    });

    // ---- create() ----

    describe('create()', () => {
      it('calls fetch with POST method', async () => {
        await api.create({ title: 'New Doc' });

        const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit | undefined];
        expect(options?.method).toBe('POST');
      });

      it('sends the data as a JSON body', async () => {
        const data = { title: 'New Doc', type: 'SOP' as const };
        await api.create(data);

        const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit | undefined];
        expect(options?.body).toBe(JSON.stringify(data));
      });

      it('calls fetch with the basePath (no id appended)', async () => {
        await api.create({ title: 'New Doc' });

        const [url] = fetchSpy.mock.calls[0] as [string];
        expect(url).toBe('/api/documents');
      });
    });

    // ---- update() ----

    describe('update()', () => {
      it('calls fetch with PUT method', async () => {
        await api.update('doc-789', { title: 'Updated' });

        const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit | undefined];
        expect(options?.method).toBe('PUT');
      });

      it('sends the data as a JSON body', async () => {
        const data = { title: 'Updated Title' };
        await api.update('doc-789', data);

        const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit | undefined];
        expect(options?.body).toBe(JSON.stringify(data));
      });

      it('calls fetch with ${basePath}/${id}', async () => {
        await api.update('doc-789', { title: 'Updated' });

        const [url] = fetchSpy.mock.calls[0] as [string];
        expect(url).toBe('/api/documents/doc-789');
      });
    });

    // ---- delete() ----

    describe('delete()', () => {
      it('calls fetch with DELETE method', async () => {
        await api.delete('doc-999');

        const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit | undefined];
        expect(options?.method).toBe('DELETE');
      });

      it('calls fetch with ${basePath}/${id}', async () => {
        await api.delete('doc-999');

        const [url] = fetchSpy.mock.calls[0] as [string];
        expect(url).toBe('/api/documents/doc-999');
      });

      it('does not send a body', async () => {
        await api.delete('doc-999');

        const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit | undefined];
        expect(options?.body).toBeUndefined();
      });
    });
  });

  // =========================================================================
  // 4. Entity API instances — existence and correct typing
  // =========================================================================

  describe('Entity API instances', () => {
    const entityApis: [string, CrudApi<unknown>][] = [
      ['documentsApi', documentsApi],
      ['capasApi', capasApi],
      ['ncrsApi', ncrsApi],
      ['auditsApi', auditsApi],
      ['trainingApi', trainingApi],
      ['risksApi', risksApi],
      ['batchRecordsApi', batchRecordsApi],
      ['suppliersApi', suppliersApi],
      ['changeControlsApi', changeControlsApi],
      ['deviationsApi', deviationsApi],
      ['formTemplatesApi', formTemplatesApi],
      ['formInstancesApi', formInstancesApi],
    ];

    it.each(entityApis)('%s exists and has all CRUD methods', (_name, api) => {
      expect(api).toBeDefined();
      expect(typeof api.list).toBe('function');
      expect(typeof api.getById).toBe('function');
      expect(typeof api.create).toBe('function');
      expect(typeof api.update).toBe('function');
      expect(typeof api.delete).toBe('function');
    });

    it('documentsApi uses the /api/documents base path', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: { success: true, data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } } }),
      );
      await documentsApi.list();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/documents');
    });

    it('capasApi uses the /api/capas base path', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: { success: true, data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } } }),
      );
      await capasApi.list();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/capas');
    });

    it('ncrsApi uses the /api/ncrs base path', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: { success: true, data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } } }),
      );
      await ncrsApi.list();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/ncrs');
    });

    it('auditsApi uses the /api/audits base path', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: { success: true, data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } } }),
      );
      await auditsApi.list();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/audits');
    });

    it('trainingApi uses the /api/training base path', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: { success: true, data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } } }),
      );
      await trainingApi.list();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/training');
    });

    it('risksApi uses the /api/risks base path', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: { success: true, data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } } }),
      );
      await risksApi.list();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/risks');
    });

    it('batchRecordsApi uses the /api/batch-records base path', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: { success: true, data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } } }),
      );
      await batchRecordsApi.list();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/batch-records');
    });

    it('suppliersApi uses the /api/suppliers base path', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: { success: true, data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } } }),
      );
      await suppliersApi.list();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/suppliers');
    });

    it('changeControlsApi uses the /api/change-controls base path', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: { success: true, data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } } }),
      );
      await changeControlsApi.list();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/change-controls');
    });

    it('deviationsApi uses the /api/deviations base path', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: { success: true, data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } } }),
      );
      await deviationsApi.list();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/deviations');
    });

    it('formTemplatesApi uses the /api/forms/templates base path', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: { success: true, data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } } }),
      );
      await formTemplatesApi.list();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/forms/templates');
    });

    it('formInstancesApi uses the /api/forms/instances base path', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: { success: true, data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } } }),
      );
      await formInstancesApi.list();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/forms/instances');
    });
  });

  // =========================================================================
  // 5. Special APIs
  // =========================================================================

  describe('auditTrailApi', () => {
    it('has a list method', () => {
      expect(auditTrailApi).toBeDefined();
      expect(typeof auditTrailApi.list).toBe('function');
    });

    it('does not have create, update, or delete methods', () => {
      expect(auditTrailApi).not.toHaveProperty('create');
      expect(auditTrailApi).not.toHaveProperty('update');
      expect(auditTrailApi).not.toHaveProperty('delete');
    });

    it('list() calls fetch with /api/audit-trail', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({
          body: { success: true, data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } },
        }),
      );
      await auditTrailApi.list();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/audit-trail');
    });

    it('list() passes query params', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({
          body: { success: true, data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } },
        }),
      );
      await auditTrailApi.list({ action: 'CREATE' });
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toContain('/api/audit-trail?');
      expect(url).toContain('action=CREATE');
    });
  });

  describe('profilesApi', () => {
    it('has list and create methods', () => {
      expect(profilesApi).toBeDefined();
      expect(typeof profilesApi.list).toBe('function');
      expect(typeof profilesApi.create).toBe('function');
    });

    it('does not have update or delete methods', () => {
      expect(profilesApi).not.toHaveProperty('update');
      expect(profilesApi).not.toHaveProperty('delete');
    });

    it('list() calls fetch with /api/profiles', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: { success: true, data: [] } }),
      );
      await profilesApi.list();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/profiles');
    });

    it('create() calls fetch with POST and JSON body', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: { success: true, data: {} } }),
      );
      const data = { email: 'test@example.com', role: 'admin' as const };
      await profilesApi.create(data);

      const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit | undefined];
      expect(url).toBe('/api/profiles');
      expect(options?.method).toBe('POST');
      expect(options?.body).toBe(JSON.stringify(data));
    });
  });

  describe('organizationsApi', () => {
    it('has list and create methods', () => {
      expect(organizationsApi).toBeDefined();
      expect(typeof organizationsApi.list).toBe('function');
      expect(typeof organizationsApi.create).toBe('function');
    });

    it('does not have update or delete methods', () => {
      expect(organizationsApi).not.toHaveProperty('update');
      expect(organizationsApi).not.toHaveProperty('delete');
    });

    it('list() calls fetch with /api/organizations', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: { success: true, data: [] } }),
      );
      await organizationsApi.list();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/organizations');
    });

    it('create() calls fetch with POST and JSON body', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: { success: true, data: {} } }),
      );
      const data = { name: 'Acme Corp', slug: 'acme', subscriptionStatus: 'trial' as const, settings: '{}' };
      await organizationsApi.create(data);

      const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit | undefined];
      expect(url).toBe('/api/organizations');
      expect(options?.method).toBe('POST');
      expect(options?.body).toBe(JSON.stringify(data));
    });
  });

  describe('exportApi', () => {
    it('has auditTrail, entity, and managementReview methods', () => {
      expect(exportApi).toBeDefined();
      expect(typeof exportApi.auditTrail).toBe('function');
      expect(typeof exportApi.entity).toBe('function');
      expect(typeof exportApi.managementReview).toBe('function');
    });

    it('auditTrail() calls fetch with /api/export/audit-trail', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: 'csv-data', contentType: 'text/csv' }),
      );
      await exportApi.auditTrail();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/export/audit-trail');
    });

    it('entity() calls fetch with /api/export/${entity}', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: 'csv-data', contentType: 'text/csv' }),
      );
      await exportApi.entity('documents');
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/export/documents');
    });

    it('entity() interpolates different entity names correctly', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: 'csv-data', contentType: 'text/csv' }),
      );
      await exportApi.entity('capas');
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/export/capas');
    });

    it('managementReview() calls fetch with /api/export/management-review', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ body: 'csv-data', contentType: 'text/csv' }),
      );
      await exportApi.managementReview();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('/api/export/management-review');
    });
  });

  // =========================================================================
  // Type-level checks (compile-time correctness)
  // =========================================================================

  describe('exported types', () => {
    it('ApiSuccessResponse has the correct shape', () => {
      const response: ApiSuccessResponse<{ id: string }> = {
        success: true,
        data: { id: 'abc' },
      };
      expect(response.success).toBe(true);
      expect(response.data.id).toBe('abc');
    });

    it('ApiPaginatedResponse has the correct shape', () => {
      const response: ApiPaginatedResponse<{ id: string }> = {
        success: true,
        data: [{ id: 'abc' }],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
      };
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
      expect(response.pagination.total).toBe(1);
    });

    it('ApiErrorResponse has the correct shape', () => {
      const response: ApiErrorResponse = {
        success: false,
        error: 'Not found',
      };
      expect(response.success).toBe(false);
      expect(response.error).toBe('Not found');
    });

    it('ApiErrorResponse can include optional details', () => {
      const response: ApiErrorResponse = {
        success: false,
        error: 'Validation failed',
        details: { fields: ['title', 'status'] },
      };
      expect(response.details).toBeDefined();
    });

    it('ApiResponse can be a success response', () => {
      const response: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: 'abc' },
      };
      expect(response.success).toBe(true);
    });

    it('ApiResponse can be an error response', () => {
      const response: ApiResponse<{ id: string }> = {
        success: false,
        error: 'Server error',
      };
      expect(response.success).toBe(false);
    });

    it('ApiListResponse can be a paginated response', () => {
      const response: ApiListResponse<{ id: string }> = {
        success: true,
        data: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      };
      expect(response.success).toBe(true);
    });

    it('ApiListResponse can be an error response', () => {
      const response: ApiListResponse<{ id: string }> = {
        success: false,
        error: 'Unauthorized',
      };
      expect(response.success).toBe(false);
    });

    it('CrudApi type expects all five methods', () => {
      const api: CrudApi<Document> = createCrudApi<Document>('/api/test');
      // If this compiles, the type is correct
      expect(typeof api.list).toBe('function');
      expect(typeof api.getById).toBe('function');
      expect(typeof api.create).toBe('function');
      expect(typeof api.update).toBe('function');
      expect(typeof api.delete).toBe('function');
    });
  });
});
