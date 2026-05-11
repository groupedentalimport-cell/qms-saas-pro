import { BaseService } from './base-service';
import type { BatchRecord } from '@/types/qms';

export class BatchRecordService extends BaseService {
  async list(page = 1, pageSize = 20, filters?: { status?: string; search?: string }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = this.supabase.from('batch_records').select('*', { count: 'exact' });
    if (this.orgId) query = query.eq('organization_id', this.orgId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.search) query = query.or(`lot_number.ilike.%${filters.search}%,product_name.ilike.%${filters.search}%`);
    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { data: (data || []).map(d => this.mapToCamel<BatchRecord>(d)), total: count || 0 };
  }

  async getById(id: string) { return super.fetchById<BatchRecord>('batch_records', id); }
  async create(record: Partial<BatchRecord>, userId?: string) { return super.insertRecord<BatchRecord>('batch_records', record, userId); }
  async update(id: string, updates: Partial<BatchRecord>, userId?: string) { return super.updateRecord<BatchRecord>('batch_records', id, updates, userId); }
  async delete(id: string, userId?: string) { return super.softDeleteRecord<BatchRecord>('batch_records', id, 'status', 'Rejected', userId); }
}
