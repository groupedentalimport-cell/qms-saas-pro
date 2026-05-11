// Base service for Supabase entity operations
// Provides common CRUD patterns with org-scoping and audit trail

import type { SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '../browser';

export abstract class BaseService {
  protected supabase: SupabaseClient;
  protected orgId: string | undefined;

  constructor(orgId?: string) {
    // Supabase client is initialized lazily via init(). Until then, we assign
    // a placeholder that will be overwritten. Services MUST call init() before use.
    // We use a type assertion here because the field is guaranteed to be set
    // before any method is called (enforced by the init pattern).
    this.supabase = undefined as unknown as SupabaseClient;
    this.orgId = orgId;
  }

  async init(): Promise<void> {
    this.supabase = createBrowserClient();
  }

  // -----------------------------------------------------------------------
  // CamelCase ↔ snake_case helpers
  // -----------------------------------------------------------------------
  protected toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  protected toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  protected mapToSnake<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[this.toSnakeCase(key)] = value;
    }
    return result;
  }

  protected mapToCamel<T>(obj: Record<string, unknown>): T {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[this.toCamelCase(key)] = value;
    }
    return result as T;
  }

  /** Converts a typed object to a plain Record for audit trail logging */
  protected toPlainRecord<T>(obj: T): Record<string, unknown> {
    return { ...(obj as Record<string, unknown>) };
  }

  // -----------------------------------------------------------------------
  // Audit trail logging
  // -----------------------------------------------------------------------
  protected async logAudit(
    action: string,
    tableName: string,
    recordId: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>,
    userId?: string,
  ) {
    const { error } = await this.supabase.from('audit_trails').insert({
      action,
      table_name: tableName,
      record_id: recordId,
      user_id: userId || null,
      old_values: oldValues ? JSON.stringify(oldValues) : null,
      new_values: newValues ? JSON.stringify(newValues) : null,
      organization_id: this.orgId || null,
    });
    if (error) console.error('Audit trail insert failed:', error.message);
  }

  // -----------------------------------------------------------------------
  // Common queries — prefixed with "fetch" to avoid name collisions
  // in subclasses that define public methods like getById, create, update.
  // -----------------------------------------------------------------------
  protected async fetchAll<T>(tableName: string, page = 1, pageSize = 20): Promise<{ data: T[]; total: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase.from(tableName).select('*', { count: 'exact' });
    if (this.orgId) query = query.eq('organization_id', this.orgId);

    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    return {
      data: (data || []).map(d => this.mapToCamel<T>(d)),
      total: count || 0,
    };
  }

  protected async fetchById<T>(tableName: string, id: string): Promise<T | null> {
    let query = this.supabase.from(tableName).select('*').eq('id', id);
    if (this.orgId) query = query.eq('organization_id', this.orgId);

    const { data, error } = await query.single();
    if (error) return null;
    return this.mapToCamel<T>(data);
  }

  protected async insertRecord<T>(tableName: string, record: Partial<T>, userId?: string): Promise<T> {
    const recordAsPlain = this.toPlainRecord(record);
    const snakeRecord = this.mapToSnake({ ...recordAsPlain, organizationId: this.orgId });
    const { data, error } = await this.supabase.from(tableName).insert(snakeRecord).select().single();
    if (error) throw new Error(error.message);

    const result = this.mapToCamel<T>(data);
    const recordId = (result as Record<string, unknown>).id as string ?? '';
    await this.logAudit('CREATE', tableName, recordId, undefined, recordAsPlain, userId);
    return result;
  }

  protected async updateRecord<T>(tableName: string, id: string, updates: Partial<T>, userId?: string): Promise<T> {
    // Get old values for audit
    const old = await this.fetchById<T>(tableName, id);
    const updatesAsPlain = this.toPlainRecord(updates);
    const snakeUpdates = this.mapToSnake(updatesAsPlain);

    let query = this.supabase.from(tableName).update(snakeUpdates).eq('id', id);
    if (this.orgId) query = query.eq('organization_id', this.orgId);

    const { data, error } = await query.select().single();
    if (error) throw new Error(error.message);

    const result = this.mapToCamel<T>(data);
    await this.logAudit('UPDATE', tableName, id, old ? this.toPlainRecord(old) : undefined, updatesAsPlain, userId);
    return result;
  }

  protected async softDeleteRecord<T>(tableName: string, id: string, statusField = 'status', statusValue = 'Obsolete', userId?: string): Promise<T> {
    return this.updateRecord<T>(tableName, id, { [statusField]: statusValue } as Partial<T>, userId);
  }
}
