import { BaseService } from './base-service';
import type { Deviation } from '@/types/qms';

export class DeviationService extends BaseService {
  async list(page = 1, pageSize = 20, filters?: { status?: string; severity?: string; search?: string }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = this.supabase.from('deviations').select('*', { count: 'exact' });
    if (this.orgId) query = query.eq('organization_id', this.orgId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.severity) query = query.eq('severity', filters.severity);
    if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,dev_number.ilike.%${filters.search}%`);
    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { data: (data || []).map(d => this.mapToCamel<Deviation>(d)), total: count || 0 };
  }

  async getById(id: string) { return super.fetchById<Deviation>('deviations', id); }
  async create(deviation: Partial<Deviation>, userId?: string) { return super.insertRecord<Deviation>('deviations', deviation, userId); }
  async update(id: string, updates: Partial<Deviation>, userId?: string) { return super.updateRecord<Deviation>('deviations', id, updates, userId); }
  async delete(id: string, userId?: string) { return super.softDeleteRecord<Deviation>('deviations', id, 'status', 'Closed', userId); }
}
