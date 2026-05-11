import { BaseService } from './base-service';
import type { NonConformance } from '@/types/qms';

export class NcrService extends BaseService {
  async list(page = 1, pageSize = 20, filters?: { status?: string; type?: string; search?: string }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = this.supabase.from('non_conformances').select('*', { count: 'exact' });
    if (this.orgId) query = query.eq('organization_id', this.orgId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,ncr_number.ilike.%${filters.search}%`);
    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { data: (data || []).map(d => this.mapToCamel<NonConformance>(d)), total: count || 0 };
  }

  async getById(id: string) { return super.fetchById<NonConformance>('non_conformances', id); }
  async create(ncr: Partial<NonConformance>, userId?: string) { return super.insertRecord<NonConformance>('non_conformances', ncr, userId); }
  async update(id: string, updates: Partial<NonConformance>, userId?: string) { return super.updateRecord<NonConformance>('non_conformances', id, updates, userId); }
  async delete(id: string, userId?: string) { return super.softDeleteRecord<NonConformance>('non_conformances', id, 'status', 'Closed', userId); }
}
