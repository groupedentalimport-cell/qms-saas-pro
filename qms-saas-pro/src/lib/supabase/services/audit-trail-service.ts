import { BaseService } from './base-service';
import type { AuditTrail } from '@/types/qms';

export class AuditTrailService extends BaseService {
  async list(page = 1, pageSize = 50, filters?: {
    action?: string;
    tableName?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = this.supabase.from('audit_trails').select('*', { count: 'exact' });
    if (this.orgId) query = query.eq('organization_id', this.orgId);
    if (filters?.action) query = query.eq('action', filters.action);
    if (filters?.tableName) query = query.eq('table_name', filters.tableName);
    if (filters?.userId) query = query.eq('user_id', filters.userId);
    if (filters?.startDate) query = query.gte('created_at', filters.startDate);
    if (filters?.endDate) query = query.lte('created_at', filters.endDate);
    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { data: (data || []).map(d => this.mapToCamel<AuditTrail>(d)), total: count || 0 };
  }

  async log(entry: Omit<AuditTrail, 'id' | 'createdAt'>, userId?: string) {
    const snakeEntry = this.mapToSnake({ ...entry, organizationId: this.orgId });
    const { data, error } = await this.supabase.from('audit_trails').insert(snakeEntry).select().single();
    if (error) throw new Error(error.message);
    return this.mapToCamel<AuditTrail>(data);
  }
}
