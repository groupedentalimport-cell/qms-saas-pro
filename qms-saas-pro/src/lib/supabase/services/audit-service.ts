import { BaseService } from './base-service';
import type { Audit } from '@/types/qms';

export class AuditService extends BaseService {
  async list(page = 1, pageSize = 20, filters?: { status?: string; type?: string; search?: string }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = this.supabase.from('audits').select('*', { count: 'exact' });
    if (this.orgId) query = query.eq('organization_id', this.orgId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,audit_number.ilike.%${filters.search}%`);
    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { data: (data || []).map(d => this.mapToCamel<Audit>(d)), total: count || 0 };
  }

  async getById(id: string) { return super.fetchById<Audit>('audits', id); }
  async create(audit: Partial<Audit>, userId?: string) { return super.insertRecord<Audit>('audits', audit, userId); }
  async update(id: string, updates: Partial<Audit>, userId?: string) { return super.updateRecord<Audit>('audits', id, updates, userId); }
  async delete(id: string, userId?: string) { return super.softDeleteRecord<Audit>('audits', id, 'status', 'Completed', userId); }
}
