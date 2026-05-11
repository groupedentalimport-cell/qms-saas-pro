import { BaseService } from './base-service';
import type { Capa } from '@/types/qms';

export class CapaService extends BaseService {
  async list(page = 1, pageSize = 20, filters?: { status?: string; type?: string; search?: string }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = this.supabase.from('capas').select('*', { count: 'exact' });
    if (this.orgId) query = query.eq('organization_id', this.orgId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,capa_number.ilike.%${filters.search}%`);
    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { data: (data || []).map(d => this.mapToCamel<Capa>(d)), total: count || 0 };
  }

  async getById(id: string) { return super.fetchById<Capa>('capas', id); }
  async create(capa: Partial<Capa>, userId?: string) { return super.insertRecord<Capa>('capas', capa, userId); }
  async update(id: string, updates: Partial<Capa>, userId?: string) { return super.updateRecord<Capa>('capas', id, updates, userId); }
  async delete(id: string, userId?: string) { return super.softDeleteRecord<Capa>('capas', id, 'status', 'Closed', userId); }
}
