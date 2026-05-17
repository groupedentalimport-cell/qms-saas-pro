import { BaseService } from './base-service';
import type { Risk } from '@/qms/types/qms';

export class RiskService extends BaseService {
  async list(page = 1, pageSize = 20, filters?: { status?: string; category?: string; search?: string }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = this.supabase.from('risks').select('*', { count: 'exact' });
    if (this.orgId) query = query.eq('organization_id', this.orgId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,risk_number.ilike.%${filters.search}%`);
    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { data: (data || []).map(d => this.mapToCamel<Risk>(d)), total: count || 0 };
  }

  async getById(id: string) { return super.fetchById<Risk>('risks', id); }
  async create(risk: Partial<Risk>, userId?: string) { return super.insertRecord<Risk>('risks', risk, userId); }
  async update(id: string, updates: Partial<Risk>, userId?: string) { return super.updateRecord<Risk>('risks', id, updates, userId); }
  async delete(id: string, userId?: string) { return super.softDeleteRecord<Risk>('risks', id, 'status', 'Closed', userId); }
}
