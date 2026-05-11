import { BaseService } from './base-service';
import type { Training } from '@/types/qms';

export class TrainingService extends BaseService {
  async list(page = 1, pageSize = 20, filters?: { status?: string; type?: string; search?: string }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = this.supabase.from('training').select('*', { count: 'exact' });
    if (this.orgId) query = query.eq('organization_id', this.orgId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.search) query = query.ilike('title', `%${filters.search}%`);
    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { data: (data || []).map(d => this.mapToCamel<Training>(d)), total: count || 0 };
  }

  async getById(id: string) { return super.fetchById<Training>('training', id); }
  async create(training: Partial<Training>, userId?: string) { return super.insertRecord<Training>('training', training, userId); }
  async update(id: string, updates: Partial<Training>, userId?: string) { return super.updateRecord<Training>('training', id, updates, userId); }
  async delete(id: string, userId?: string) { return super.softDeleteRecord<Training>('training', id, 'status', 'Completed', userId); }
}
