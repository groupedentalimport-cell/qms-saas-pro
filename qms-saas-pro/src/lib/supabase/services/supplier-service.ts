import { BaseService } from './base-service';
import type { Supplier } from '@/types/qms';

export class SupplierService extends BaseService {
  async list(page = 1, pageSize = 20, filters?: { status?: string; category?: string; search?: string }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = this.supabase.from('suppliers').select('*', { count: 'exact' });
    if (this.orgId) query = query.eq('organization_id', this.orgId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,supplier_code.ilike.%${filters.search}%`);
    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { data: (data || []).map(d => this.mapToCamel<Supplier>(d)), total: count || 0 };
  }

  async getById(id: string) { return super.fetchById<Supplier>('suppliers', id); }
  async create(supplier: Partial<Supplier>, userId?: string) { return super.insertRecord<Supplier>('suppliers', supplier, userId); }
  async update(id: string, updates: Partial<Supplier>, userId?: string) { return super.updateRecord<Supplier>('suppliers', id, updates, userId); }
  async delete(id: string, userId?: string) { return super.softDeleteRecord<Supplier>('suppliers', id, 'status', 'Disqualified', userId); }
}
