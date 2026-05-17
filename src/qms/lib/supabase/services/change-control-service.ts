import { BaseService } from './base-service';
import type { ChangeControl } from '@/qms/types/qms';

export class ChangeControlService extends BaseService {
  async list(page = 1, pageSize = 20, filters?: { status?: string; priority?: string; search?: string }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = this.supabase.from('change_controls').select('*', { count: 'exact' });
    if (this.orgId) query = query.eq('organization_id', this.orgId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,cc_number.ilike.%${filters.search}%`);
    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { data: (data || []).map(d => this.mapToCamel<ChangeControl>(d)), total: count || 0 };
  }

  async getById(id: string) { return super.fetchById<ChangeControl>('change_controls', id); }
  async create(cc: Partial<ChangeControl>, userId?: string) { return super.insertRecord<ChangeControl>('change_controls', cc, userId); }
  async update(id: string, updates: Partial<ChangeControl>, userId?: string) { return super.updateRecord<ChangeControl>('change_controls', id, updates, userId); }
  async delete(id: string, userId?: string) { return super.softDeleteRecord<ChangeControl>('change_controls', id, 'status', 'Rejected', userId); }
}
