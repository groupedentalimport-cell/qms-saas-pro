import { BaseService } from './base-service';
import type { Document } from '@/types/qms';

export class DocumentService extends BaseService {
  async list(page = 1, pageSize = 20, filters?: { status?: string; type?: string; search?: string }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = this.supabase.from('documents').select('*', { count: 'exact' });
    if (this.orgId) query = query.eq('organization_id', this.orgId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%`);
    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { data: (data || []).map(d => this.mapToCamel<Document>(d)), total: count || 0 };
  }

  async getById(id: string) { return super.fetchById<Document>('documents', id); }

  async create(doc: Partial<Document>, userId?: string) { return super.insertRecord<Document>('documents', doc, userId); }

  async update(id: string, updates: Partial<Document>, userId?: string) { return super.updateRecord<Document>('documents', id, updates, userId); }

  async delete(id: string, userId?: string) { return super.softDeleteRecord<Document>('documents', id, 'status', 'Obsolete', userId); }
}
