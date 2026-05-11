import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseService } from '@/lib/supabase/services/base-service';

// ---------------------------------------------------------------------------
// Concrete subclass to expose protected methods for testing
// ---------------------------------------------------------------------------

class TestService extends BaseService {
  public testToSnakeCase(str: string) {
    return this.toSnakeCase(str);
  }

  public testToCamelCase(str: string) {
    return this.toCamelCase(str);
  }

  public testMapToSnake(obj: Record<string, unknown>) {
    return this.mapToSnake(obj);
  }

  public testMapToCamel<T>(obj: Record<string, unknown>): T {
    return this.mapToCamel<T>(obj);
  }

  // Expose CRUD methods publicly for testing (using renamed base methods)
  public testGetAll<T>(tableName: string, page?: number, pageSize?: number) {
    return this.fetchAll<T>(tableName, page, pageSize);
  }

  public testGetById<T>(tableName: string, id: string) {
    return this.fetchById<T>(tableName, id);
  }

  public testCreate<T>(tableName: string, record: Record<string, unknown>, userId?: string) {
    return this.insertRecord<T>(tableName, record as Partial<T>, userId);
  }

  public testUpdate<T>(tableName: string, id: string, updates: Record<string, unknown>, userId?: string) {
    return this.updateRecord<T>(tableName, id, updates as Partial<T>, userId);
  }

  public testSoftDelete<T>(tableName: string, id: string, statusField?: string, statusValue?: string, userId?: string) {
    return this.softDeleteRecord<T>(tableName, id, statusField, statusValue, userId);
  }

  public testLogAudit(
    action: string,
    tableName: string,
    recordId: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>,
    userId?: string,
  ) {
    return this.logAudit(action, tableName, recordId, oldValues, newValues, userId);
  }

  // Allow tests to inject a mock supabase client
  public setSupabase(client: unknown) {
    this.supabase = client as BaseService['supabase'];
  }
}

// ---------------------------------------------------------------------------
// Mock Supabase client builder
// ---------------------------------------------------------------------------

function buildMockSupabase() {
  const mockSingle = vi.fn();
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockRange = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();

  const queryBuilder = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    eq: mockEq,
    range: mockRange,
    order: mockOrder,
    single: mockSingle,
  };

  // Most chainable methods return the query builder itself
  mockSelect.mockReturnValue(queryBuilder);
  mockInsert.mockReturnValue(queryBuilder);
  mockUpdate.mockReturnValue(queryBuilder);
  mockEq.mockReturnValue(queryBuilder);
  mockRange.mockReturnValue(queryBuilder);
  mockOrder.mockReturnValue(queryBuilder);

  const mockFrom = vi.fn().mockReturnValue(queryBuilder);
  const mockSupabase = { from: mockFrom };

  return {
    mockSupabase,
    mockFrom,
    mockSelect,
    mockInsert,
    mockUpdate,
    mockEq,
    mockRange,
    mockOrder,
    mockSingle,
    queryBuilder,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BaseService', () => {
  // =========================================================================
  // 1. toSnakeCase
  // =========================================================================

  describe('toSnakeCase()', () => {
    let service: TestService;

    beforeEach(() => {
      service = new TestService();
    });

    it('returns a single lowercase word unchanged', () => {
      expect(service.testToSnakeCase('name')).toBe('name');
    });

    it('converts a simple two-word camelCase string', () => {
      expect(service.testToSnakeCase('documentNumber')).toBe('document_number');
    });

    it('converts createdAt to created_at', () => {
      expect(service.testToSnakeCase('createdAt')).toBe('created_at');
    });

    it('converts multiple consecutive uppercase words correctly', () => {
      // e.g. 'organizationId' → 'organization_id'
      expect(service.testToSnakeCase('organizationId')).toBe('organization_id');
    });

    it('converts three-word camelCase correctly', () => {
      // e.g. 'batchRecordStatus' → 'batch_record_status'
      expect(service.testToSnakeCase('batchRecordStatus')).toBe('batch_record_status');
    });

    it('handles an already snake_case string (no uppercase letters)', () => {
      expect(service.testToSnakeCase('already_snake')).toBe('already_snake');
    });

    it('handles empty string', () => {
      expect(service.testToSnakeCase('')).toBe('');
    });

    it('converts a single uppercase letter at the start to lowercase with underscore prefix', () => {
      // 'URL' → '_u_r_l' — the regex inserts _ before each uppercase letter
      expect(service.testToSnakeCase('URL')).toBe('_u_r_l');
    });

    it('converts string with trailing uppercase word', () => {
      // 'documentHTML' → 'document_h_t_m_l'
      expect(service.testToSnakeCase('documentHTML')).toBe('document_h_t_m_l');
    });
  });

  // =========================================================================
  // 2. toCamelCase
  // =========================================================================

  describe('toCamelCase()', () => {
    let service: TestService;

    beforeEach(() => {
      service = new TestService();
    });

    it('returns a single lowercase word unchanged', () => {
      expect(service.testToCamelCase('name')).toBe('name');
    });

    it('converts a simple two-word snake_case string', () => {
      expect(service.testToCamelCase('document_number')).toBe('documentNumber');
    });

    it('converts created_at to createdAt', () => {
      expect(service.testToCamelCase('created_at')).toBe('createdAt');
    });

    it('converts organization_id to organizationId', () => {
      expect(service.testToCamelCase('organization_id')).toBe('organizationId');
    });

    it('converts three-word snake_case correctly', () => {
      expect(service.testToCamelCase('batch_record_status')).toBe('batchRecordStatus');
    });

    it('handles an already camelCase string (no underscores)', () => {
      expect(service.testToCamelCase('alreadyCamel')).toBe('alreadyCamel');
    });

    it('handles empty string', () => {
      expect(service.testToCamelCase('')).toBe('');
    });

    it('converts trailing underscore + letter', () => {
      expect(service.testToCamelCase('record_id_')).toBe('recordId_');
    });
  });

  // =========================================================================
  // 3. mapToSnake
  // =========================================================================

  describe('mapToSnake()', () => {
    let service: TestService;

    beforeEach(() => {
      service = new TestService();
    });

    it('converts all keys in a flat object to snake_case', () => {
      const input = {
        documentNumber: 'DOC-001',
        createdAt: '2024-01-01',
        status: 'Active',
      };

      const result = service.testMapToSnake(input);

      expect(result).toEqual({
        document_number: 'DOC-001',
        created_at: '2024-01-01',
        status: 'Active',
      });
    });

    it('handles an empty object', () => {
      expect(service.testMapToSnake({})).toEqual({});
    });

    it('preserves values without modification', () => {
      const input = { myKey: 42, anotherKey: true };
      const result = service.testMapToSnake(input);

      expect(result.my_key).toBe(42);
      expect(result.another_key).toBe(true);
    });

    it('converts key names for nested objects (only top-level keys)', () => {
      const input = {
        outerKey: {
          innerKey: 'value',
        },
      };

      const result = service.testMapToSnake(input);

      // Only top-level keys are converted; nested object keys stay as-is
      expect(result).toHaveProperty('outer_key');
      expect(result.outer_key).toEqual({ innerKey: 'value' });
    });

    it('handles keys that are already snake_case', () => {
      const input = { already_snake: 'value' };
      const result = service.testMapToSnake(input);

      expect(result).toEqual({ already_snake: 'value' });
    });

    it('handles null and undefined values', () => {
      const input = { myKey: null, otherKey: undefined };
      const result = service.testMapToSnake(input);

      expect(result.my_key).toBeNull();
      expect(result.other_key).toBeUndefined();
    });
  });

  // =========================================================================
  // 4. mapToCamel
  // =========================================================================

  describe('mapToCamel()', () => {
    let service: TestService;

    beforeEach(() => {
      service = new TestService();
    });

    it('converts all keys in a flat object to camelCase', () => {
      const input = {
        document_number: 'DOC-001',
        created_at: '2024-01-01',
        status: 'Active',
      };

      const result = service.testMapToCamel(input);

      expect(result).toEqual({
        documentNumber: 'DOC-001',
        createdAt: '2024-01-01',
        status: 'Active',
      });
    });

    it('handles an empty object', () => {
      expect(service.testMapToCamel({})).toEqual({});
    });

    it('preserves values without modification', () => {
      const input = { my_key: 42, another_key: true };
      const result = service.testMapToCamel(input);

      expect(result).toEqual({ myKey: 42, anotherKey: true });
    });

    it('converts key names for nested objects (only top-level keys)', () => {
      const input = {
        outer_key: {
          inner_key: 'value',
        },
      };

      const result = service.testMapToCamel(input);

      // Only top-level keys are converted; nested object keys stay as-is
      expect(result).toHaveProperty('outerKey');
      expect((result as Record<string, unknown>).outerKey).toEqual({ inner_key: 'value' });
    });

    it('handles keys that are already camelCase', () => {
      const input = { alreadyCamel: 'value' };
      const result = service.testMapToCamel(input);

      expect(result).toEqual({ alreadyCamel: 'value' });
    });

    it('handles null and undefined values', () => {
      const input = { my_key: null, other_key: undefined };
      const result = service.testMapToCamel(input) as Record<string, unknown>;

      expect(result.myKey).toBeNull();
      expect(result.otherKey).toBeUndefined();
    });

    it('round-trips with mapToSnake', () => {
      const original = { firstName: 'John', lastName: 'Doe' };
      const snake = service.testMapToSnake(original);
      const roundTripped = service.testMapToCamel(snake);

      expect(roundTripped).toEqual(original);
    });
  });

  // =========================================================================
  // 5. Constructor
  // =========================================================================

  describe('Constructor', () => {
    it('stores the orgId when provided', () => {
      const service = new TestService('org-123');
      expect((service as unknown as { orgId: string }).orgId).toBe('org-123');
    });

    it('allows orgId to be undefined', () => {
      const service = new TestService();
      expect((service as unknown as { orgId: undefined }).orgId).toBeUndefined();
    });

    it('initializes supabase as undefined (requires init())', () => {
      const service = new TestService('org-123');
      // supabase is set to undefined as unknown as SupabaseClient until init() is called
      expect((service as unknown as { supabase: undefined }).supabase).toBeUndefined();
    });
  });

  // =========================================================================
  // 6. CRUD methods (mocked Supabase client)
  // =========================================================================

  describe('CRUD methods with mocked Supabase', () => {
    let service: TestService;
    let mocks: ReturnType<typeof buildMockSupabase>;

    beforeEach(() => {
      service = new TestService('org-abc');
      mocks = buildMockSupabase();
      service.setSupabase(mocks.mockSupabase);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    // -----------------------------------------------------------------------
    // getAll
    // -----------------------------------------------------------------------

    describe('getAll()', () => {
      it('calls supabase.from() with the correct table name', async () => {
        mocks.mockOrder.mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        });

        await service.testGetAll('documents');

        expect(mocks.mockFrom).toHaveBeenCalledWith('documents');
      });

      it('calls .select() with "*" and { count: "exact" }', async () => {
        mocks.mockOrder.mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        });

        await service.testGetAll('documents');

        expect(mocks.mockSelect).toHaveBeenCalledWith('*', { count: 'exact' });
      });

      it('applies org-scoping when orgId is set', async () => {
        mocks.mockOrder.mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        });

        await service.testGetAll('documents');

        // eq should be called with organization_id and orgId
        expect(mocks.mockEq).toHaveBeenCalledWith('organization_id', 'org-abc');
      });

      it('does not apply org-scoping when orgId is undefined', async () => {
        const noOrgService = new TestService();
        const noOrgMocks = buildMockSupabase();
        noOrgService.setSupabase(noOrgMocks.mockSupabase);
        noOrgMocks.mockOrder.mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        });

        await noOrgService.testGetAll('documents');

        // eq should only be called for .range, not for organization_id
        // Actually eq is not called at all without orgId — range and order are
        // Check that eq was NOT called with 'organization_id'
        const orgIdCalls = noOrgMocks.mockEq.mock.calls.filter(
          (call: unknown[]) => call[0] === 'organization_id',
        );
        expect(orgIdCalls).toHaveLength(0);
      });

      it('calculates correct range for page 1, pageSize 20', async () => {
        mocks.mockOrder.mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        });

        await service.testGetAll('documents', 1, 20);

        expect(mocks.mockRange).toHaveBeenCalledWith(0, 19);
      });

      it('calculates correct range for page 2, pageSize 10', async () => {
        mocks.mockOrder.mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        });

        await service.testGetAll('documents', 2, 10);

        expect(mocks.mockRange).toHaveBeenCalledWith(10, 19);
      });

      it('calculates correct range for page 3, pageSize 25', async () => {
        mocks.mockOrder.mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        });

        await service.testGetAll('documents', 3, 25);

        // from = (3-1)*25 = 50, to = 50+25-1 = 74
        expect(mocks.mockRange).toHaveBeenCalledWith(50, 74);
      });

      it('orders by created_at descending', async () => {
        mocks.mockOrder.mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        });

        await service.testGetAll('documents');

        expect(mocks.mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      });

      it('returns data with keys mapped to camelCase', async () => {
        mocks.mockOrder.mockResolvedValue({
          data: [
            { id: '1', document_number: 'DOC-001', created_at: '2024-01-01' },
            { id: '2', document_number: 'DOC-002', created_at: '2024-01-02' },
          ],
          count: 2,
          error: null,
        });

        const result = await service.testGetAll('documents');

        expect(result.data).toEqual([
          { id: '1', documentNumber: 'DOC-001', createdAt: '2024-01-01' },
          { id: '2', documentNumber: 'DOC-002', createdAt: '2024-01-02' },
        ]);
      });

      it('returns total count from the query', async () => {
        mocks.mockOrder.mockResolvedValue({
          data: [],
          count: 42,
          error: null,
        });

        const result = await service.testGetAll('documents');

        expect(result.total).toBe(42);
      });

      it('defaults total to 0 when count is null', async () => {
        mocks.mockOrder.mockResolvedValue({
          data: [],
          count: null,
          error: null,
        });

        const result = await service.testGetAll('documents');

        expect(result.total).toBe(0);
      });

      it('defaults data to empty array when data is null', async () => {
        mocks.mockOrder.mockResolvedValue({
          data: null,
          count: 0,
          error: null,
        });

        const result = await service.testGetAll('documents');

        expect(result.data).toEqual([]);
      });

      it('throws an error when supabase returns an error', async () => {
        mocks.mockOrder.mockResolvedValue({
          data: null,
          count: 0,
          error: { message: 'Relation does not exist' },
        });

        await expect(service.testGetAll('bad_table')).rejects.toThrow('Relation does not exist');
      });

      it('uses default pagination values (page=1, pageSize=20)', async () => {
        mocks.mockOrder.mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        });

        await service.testGetAll('documents');

        // Default: page=1, pageSize=20 → range(0, 19)
        expect(mocks.mockRange).toHaveBeenCalledWith(0, 19);
      });
    });

    // -----------------------------------------------------------------------
    // getById
    // -----------------------------------------------------------------------

    describe('getById()', () => {
      it('calls supabase.from() with the correct table name', async () => {
        mocks.mockSingle.mockResolvedValue({
          data: { id: 'doc-1', document_number: 'DOC-001' },
          error: null,
        });

        await service.testGetById('documents', 'doc-1');

        expect(mocks.mockFrom).toHaveBeenCalledWith('documents');
      });

      it('calls .select("*").eq("id", id)', async () => {
        mocks.mockSingle.mockResolvedValue({
          data: { id: 'doc-1', document_number: 'DOC-001' },
          error: null,
        });

        await service.testGetById('documents', 'doc-1');

        expect(mocks.mockSelect).toHaveBeenCalledWith('*');
        expect(mocks.mockEq).toHaveBeenCalledWith('id', 'doc-1');
      });

      it('applies org-scoping when orgId is set', async () => {
        mocks.mockSingle.mockResolvedValue({
          data: { id: 'doc-1', document_number: 'DOC-001' },
          error: null,
        });

        await service.testGetById('documents', 'doc-1');

        // eq is called with id first, then organization_id
        expect(mocks.mockEq).toHaveBeenCalledWith('organization_id', 'org-abc');
      });

      it('returns mapped camelCase object on success', async () => {
        mocks.mockSingle.mockResolvedValue({
          data: { id: 'doc-1', document_number: 'DOC-001', created_at: '2024-01-01' },
          error: null,
        });

        const result = await service.testGetById('documents', 'doc-1');

        expect(result).toEqual({
          id: 'doc-1',
          documentNumber: 'DOC-001',
          createdAt: '2024-01-01',
        });
      });

      it('returns null when supabase returns an error', async () => {
        mocks.mockSingle.mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        });

        const result = await service.testGetById('documents', 'nonexistent');

        expect(result).toBeNull();
      });
    });

    // -----------------------------------------------------------------------
    // create
    // -----------------------------------------------------------------------

    describe('create()', () => {
      it('calls supabase.from() with the correct table name', async () => {
        mocks.mockSingle.mockResolvedValue({
          data: { id: 'new-1', document_number: 'DOC-NEW', organization_id: 'org-abc' },
          error: null,
        });

        await service.testCreate('documents', { documentNumber: 'DOC-NEW' }, 'user-1');

        expect(mocks.mockFrom).toHaveBeenCalledWith('documents');
      });

      it('maps record keys to snake_case and adds organization_id before insert', async () => {
        mocks.mockSingle.mockResolvedValue({
          data: { id: 'new-1', document_number: 'DOC-NEW', organization_id: 'org-abc' },
          error: null,
        });

        await service.testCreate('documents', { documentNumber: 'DOC-NEW' }, 'user-1');

        expect(mocks.mockInsert).toHaveBeenCalledWith({
          document_number: 'DOC-NEW',
          organization_id: 'org-abc',
        });
      });

      it('calls .insert().select().single()', async () => {
        mocks.mockSingle.mockResolvedValue({
          data: { id: 'new-1', document_number: 'DOC-NEW', organization_id: 'org-abc' },
          error: null,
        });

        await service.testCreate('documents', { documentNumber: 'DOC-NEW' });

        expect(mocks.mockInsert).toHaveBeenCalled();
        expect(mocks.mockSelect).toHaveBeenCalled();
        expect(mocks.mockSingle).toHaveBeenCalled();
      });

      it('returns mapped camelCase result', async () => {
        mocks.mockSingle.mockResolvedValue({
          data: { id: 'new-1', document_number: 'DOC-NEW', organization_id: 'org-abc', created_at: '2024-06-01' },
          error: null,
        });

        const result = await service.testCreate('documents', { documentNumber: 'DOC-NEW' });

        expect(result).toEqual({
          id: 'new-1',
          documentNumber: 'DOC-NEW',
          organizationId: 'org-abc',
          createdAt: '2024-06-01',
        });
      });

      it('logs an audit trail after successful create', async () => {
        mocks.mockSingle.mockResolvedValue({
          data: { id: 'new-1', document_number: 'DOC-NEW', organization_id: 'org-abc' },
          error: null,
        });

        // We need to also mock the audit_trails insert
        const auditInsert = vi.fn().mockResolvedValue({ error: null });
        mocks.mockFrom.mockImplementation((tableName: string) => {
          if (tableName === 'audit_trails') {
            return { insert: auditInsert };
          }
          return mocks.queryBuilder;
        });

        await service.testCreate('documents', { documentNumber: 'DOC-NEW' }, 'user-42');

        expect(mocks.mockFrom).toHaveBeenCalledWith('audit_trails');
        expect(auditInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'CREATE',
            table_name: 'documents',
            record_id: 'new-1',
            user_id: 'user-42',
            organization_id: 'org-abc',
          }),
        );
      });

      it('passes undefined userId as null in audit trail', async () => {
        mocks.mockSingle.mockResolvedValue({
          data: { id: 'new-1', document_number: 'DOC-NEW', organization_id: 'org-abc' },
          error: null,
        });

        const auditInsert = vi.fn().mockResolvedValue({ error: null });
        mocks.mockFrom.mockImplementation((tableName: string) => {
          if (tableName === 'audit_trails') {
            return { insert: auditInsert };
          }
          return mocks.queryBuilder;
        });

        await service.testCreate('documents', { documentNumber: 'DOC-NEW' });

        expect(auditInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: null,
          }),
        );
      });

      it('throws an error when supabase insert returns an error', async () => {
        mocks.mockSingle.mockResolvedValue({
          data: null,
          error: { message: 'Insert failed: constraint violation' },
        });

        await expect(
          service.testCreate('documents', { documentNumber: 'DUP' }),
        ).rejects.toThrow('Insert failed: constraint violation');
      });

      it('serializes newValues to JSON in audit trail', async () => {
        mocks.mockSingle.mockResolvedValue({
          data: { id: 'new-1', document_number: 'DOC-NEW', organization_id: 'org-abc' },
          error: null,
        });

        const auditInsert = vi.fn().mockResolvedValue({ error: null });
        mocks.mockFrom.mockImplementation((tableName: string) => {
          if (tableName === 'audit_trails') {
            return { insert: auditInsert };
          }
          return mocks.queryBuilder;
        });

        const record = { documentNumber: 'DOC-NEW', status: 'Draft' };
        await service.testCreate('documents', record, 'user-1');

        expect(auditInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            new_values: JSON.stringify(record),
            old_values: null,
          }),
        );
      });
    });

    // -----------------------------------------------------------------------
    // update
    // -----------------------------------------------------------------------

    describe('update()', () => {
      it('fetches old values via getById before updating', async () => {
        // First call: getById → returns old data
        // Second call: update query
        // Third call: audit_trails insert from logAudit
        const auditInsert = vi.fn().mockResolvedValue({ error: null });
        mocks.mockFrom.mockImplementation((tableName: string) => {
          if (tableName === 'audit_trails') {
            return { insert: auditInsert };
          }
          return mocks.queryBuilder;
        });

        // getById resolves
        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', document_number: 'DOC-OLD', status: 'Draft', organization_id: 'org-abc' },
          error: null,
        });

        // update resolves
        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', document_number: 'DOC-OLD', status: 'Approved', organization_id: 'org-abc' },
          error: null,
        });

        await service.testUpdate('documents', 'doc-1', { status: 'Approved' }, 'user-1');

        // .from('documents') is called twice: once for getById, once for update
        // .from('audit_trails') is called once for logAudit
        expect(mocks.mockFrom).toHaveBeenCalledWith('documents');
        expect(mocks.mockFrom).toHaveBeenCalledWith('audit_trails');
        expect(mocks.mockFrom).toHaveBeenCalledTimes(3);
      });

      it('maps update keys to snake_case before sending', async () => {
        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', document_number: 'DOC-OLD', status: 'Draft' },
          error: null,
        });

        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', document_number: 'DOC-OLD', status: 'Approved' },
          error: null,
        });

        await service.testUpdate('documents', 'doc-1', { status: 'Approved' });

        expect(mocks.mockUpdate).toHaveBeenCalledWith({ status: 'Approved' });
      });

      it('maps camelCase update keys to snake_case', async () => {
        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', document_number: 'DOC-OLD' },
          error: null,
        });

        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', document_number: 'DOC-NEW' },
          error: null,
        });

        await service.testUpdate('documents', 'doc-1', { documentNumber: 'DOC-NEW' });

        expect(mocks.mockUpdate).toHaveBeenCalledWith({ document_number: 'DOC-NEW' });
      });

      it('applies org-scoping when orgId is set', async () => {
        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', status: 'Draft' },
          error: null,
        });

        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', status: 'Approved' },
          error: null,
        });

        await service.testUpdate('documents', 'doc-1', { status: 'Approved' });

        // eq is called with 'id' and 'organization_id' for the update query
        expect(mocks.mockEq).toHaveBeenCalledWith('id', 'doc-1');
        expect(mocks.mockEq).toHaveBeenCalledWith('organization_id', 'org-abc');
      });

      it('returns mapped camelCase result', async () => {
        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', document_number: 'DOC-OLD', created_at: '2024-01-01' },
          error: null,
        });

        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', document_number: 'DOC-NEW', created_at: '2024-01-01' },
          error: null,
        });

        const result = await service.testUpdate('documents', 'doc-1', { documentNumber: 'DOC-NEW' });

        expect(result).toEqual({
          id: 'doc-1',
          documentNumber: 'DOC-NEW',
          createdAt: '2024-01-01',
        });
      });

      it('logs an audit trail with old and new values', async () => {
        const oldData = { id: 'doc-1', document_number: 'DOC-OLD', status: 'Draft', organization_id: 'org-abc' };
        const newData = { id: 'doc-1', document_number: 'DOC-OLD', status: 'Approved', organization_id: 'org-abc' };

        mocks.mockSingle.mockResolvedValueOnce({ data: oldData, error: null });
        mocks.mockSingle.mockResolvedValueOnce({ data: newData, error: null });

        const auditInsert = vi.fn().mockResolvedValue({ error: null });
        mocks.mockFrom.mockImplementation((tableName: string) => {
          if (tableName === 'audit_trails') {
            return { insert: auditInsert };
          }
          return mocks.queryBuilder;
        });

        const updates = { status: 'Approved' };
        await service.testUpdate('documents', 'doc-1', updates, 'user-99');

        expect(auditInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'UPDATE',
            table_name: 'documents',
            record_id: 'doc-1',
            user_id: 'user-99',
            organization_id: 'org-abc',
            old_values: JSON.stringify({
              id: 'doc-1',
              documentNumber: 'DOC-OLD',
              status: 'Draft',
              organizationId: 'org-abc',
            }),
            new_values: JSON.stringify(updates),
          }),
        );
      });

      it('throws an error when supabase update returns an error', async () => {
        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', status: 'Draft' },
          error: null,
        });

        mocks.mockSingle.mockResolvedValueOnce({
          data: null,
          error: { message: 'Update failed: row not found' },
        });

        await expect(
          service.testUpdate('documents', 'doc-1', { status: 'Approved' }),
        ).rejects.toThrow('Update failed: row not found');
      });
    });

    // -----------------------------------------------------------------------
    // softDelete
    // -----------------------------------------------------------------------

    describe('softDelete()', () => {
      it('calls update with status field set to "Obsolete" by default', async () => {
        // Spy on the internal update by checking that the update query is called
        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', status: 'Active', organization_id: 'org-abc' },
          error: null,
        });

        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', status: 'Obsolete', organization_id: 'org-abc' },
          error: null,
        });

        const result = await service.testSoftDelete('documents', 'doc-1');

        // The update method should be called with { status: 'Obsolete' }
        expect(mocks.mockUpdate).toHaveBeenCalledWith({ status: 'Obsolete' });

        expect(result).toEqual({
          id: 'doc-1',
          status: 'Obsolete',
          organizationId: 'org-abc',
        });
      });

      it('calls update with custom status field and value', async () => {
        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', record_status: 'Active', organization_id: 'org-abc' },
          error: null,
        });

        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', record_status: 'Deleted', organization_id: 'org-abc' },
          error: null,
        });

        await service.testSoftDelete('documents', 'doc-1', 'record_status', 'Deleted');

        expect(mocks.mockUpdate).toHaveBeenCalledWith({ record_status: 'Deleted' });
      });

      it('passes userId to the underlying update method', async () => {
        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', status: 'Active' },
          error: null,
        });

        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', status: 'Obsolete' },
          error: null,
        });

        const auditInsert = vi.fn().mockResolvedValue({ error: null });
        mocks.mockFrom.mockImplementation((tableName: string) => {
          if (tableName === 'audit_trails') {
            return { insert: auditInsert };
          }
          return mocks.queryBuilder;
        });

        await service.testSoftDelete('documents', 'doc-1', 'status', 'Obsolete', 'user-55');

        expect(auditInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'UPDATE',
            user_id: 'user-55',
          }),
        );
      });

      it('logs audit trail as UPDATE action (not DELETE)', async () => {
        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', status: 'Active' },
          error: null,
        });

        mocks.mockSingle.mockResolvedValueOnce({
          data: { id: 'doc-1', status: 'Obsolete' },
          error: null,
        });

        const auditInsert = vi.fn().mockResolvedValue({ error: null });
        mocks.mockFrom.mockImplementation((tableName: string) => {
          if (tableName === 'audit_trails') {
            return { insert: auditInsert };
          }
          return mocks.queryBuilder;
        });

        await service.testSoftDelete('documents', 'doc-1');

        expect(auditInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'UPDATE',
          }),
        );
      });
    });

    // -----------------------------------------------------------------------
    // logAudit
    // -----------------------------------------------------------------------

    describe('logAudit()', () => {
      it('inserts an audit trail record with all fields', async () => {
        const auditInsert = vi.fn().mockResolvedValue({ error: null });
        mocks.mockFrom.mockImplementation((tableName: string) => {
          if (tableName === 'audit_trails') {
            return { insert: auditInsert };
          }
          return mocks.queryBuilder;
        });

        await service.testLogAudit(
          'CREATE',
          'documents',
          'rec-123',
          { id: 'rec-123', oldField: 'old' },
          { id: 'rec-123', newField: 'new' },
          'user-1',
        );

        expect(mocks.mockFrom).toHaveBeenCalledWith('audit_trails');
        expect(auditInsert).toHaveBeenCalledWith({
          action: 'CREATE',
          table_name: 'documents',
          record_id: 'rec-123',
          user_id: 'user-1',
          old_values: JSON.stringify({ id: 'rec-123', oldField: 'old' }),
          new_values: JSON.stringify({ id: 'rec-123', newField: 'new' }),
          organization_id: 'org-abc',
        });
      });

      it('passes null for oldValues when not provided', async () => {
        const auditInsert = vi.fn().mockResolvedValue({ error: null });
        mocks.mockFrom.mockImplementation((tableName: string) => {
          if (tableName === 'audit_trails') {
            return { insert: auditInsert };
          }
          return mocks.queryBuilder;
        });

        await service.testLogAudit('CREATE', 'documents', 'rec-456', undefined, { title: 'New' }, 'user-2');

        expect(auditInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            old_values: null,
            new_values: JSON.stringify({ title: 'New' }),
          }),
        );
      });

      it('passes null for newValues when not provided', async () => {
        const auditInsert = vi.fn().mockResolvedValue({ error: null });
        mocks.mockFrom.mockImplementation((tableName: string) => {
          if (tableName === 'audit_trails') {
            return { insert: auditInsert };
          }
          return mocks.queryBuilder;
        });

        await service.testLogAudit('DELETE', 'documents', 'rec-789', { title: 'Old' }, undefined, 'user-3');

        expect(auditInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            old_values: JSON.stringify({ title: 'Old' }),
            new_values: null,
          }),
        );
      });

      it('passes null for userId when not provided', async () => {
        const auditInsert = vi.fn().mockResolvedValue({ error: null });
        mocks.mockFrom.mockImplementation((tableName: string) => {
          if (tableName === 'audit_trails') {
            return { insert: auditInsert };
          }
          return mocks.queryBuilder;
        });

        await service.testLogAudit('UPDATE', 'documents', 'rec-000');

        expect(auditInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: null,
          }),
        );
      });

      it('passes null for organization_id when orgId is not set', async () => {
        const noOrgService = new TestService();
        const noOrgMocks = buildMockSupabase();
        noOrgService.setSupabase(noOrgMocks.mockSupabase);

        const auditInsert = vi.fn().mockResolvedValue({ error: null });
        noOrgMocks.mockFrom.mockImplementation((tableName: string) => {
          if (tableName === 'audit_trails') {
            return { insert: auditInsert };
          }
          return noOrgMocks.queryBuilder;
        });

        await noOrgService.testLogAudit('CREATE', 'documents', 'rec-no-org');

        expect(auditInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            organization_id: null,
          }),
        );
      });

      it('logs error to console when audit insert fails', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const auditInsert = vi.fn().mockResolvedValue({
          error: { message: 'Foreign key violation' },
        });
        mocks.mockFrom.mockImplementation((tableName: string) => {
          if (tableName === 'audit_trails') {
            return { insert: auditInsert };
          }
          return mocks.queryBuilder;
        });

        // Should NOT throw, just log
        await service.testLogAudit('CREATE', 'documents', 'rec-err');

        expect(consoleErrorSpy).toHaveBeenCalledWith('Audit trail insert failed:', 'Foreign key violation');

        consoleErrorSpy.mockRestore();
      });
    });
  });
});
