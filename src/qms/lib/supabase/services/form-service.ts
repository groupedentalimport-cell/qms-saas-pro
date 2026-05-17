import { BaseService } from './base-service';
import type { FormTemplate, FormInstance } from '@/qms/types/qms';

export class FormService extends BaseService {
  // -----------------------------------------------------------------------
  // Templates
  // -----------------------------------------------------------------------
  async listTemplates(page = 1, pageSize = 20, filters?: { isActive?: boolean }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = this.supabase.from('form_templates').select('*', { count: 'exact' });
    if (this.orgId) query = query.eq('organization_id', this.orgId);
    if (filters?.isActive !== undefined) query = query.eq('is_active', filters.isActive);
    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { data: (data || []).map(d => this.mapToCamel<FormTemplate>(d)), total: count || 0 };
  }

  async getTemplateById(id: string) { return super.fetchById<FormTemplate>('form_templates', id); }

  async createTemplate(template: Partial<FormTemplate>, userId?: string) {
    return super.insertRecord<FormTemplate>('form_templates', template, userId);
  }

  // -----------------------------------------------------------------------
  // Instances
  // -----------------------------------------------------------------------
  async listInstances(page = 1, pageSize = 20, filters?: { status?: string; templateId?: string }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = this.supabase.from('form_instances').select('*', { count: 'exact' });
    if (this.orgId) query = query.eq('organization_id', this.orgId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.templateId) query = query.eq('template_id', filters.templateId);
    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { data: (data || []).map(d => this.mapToCamel<FormInstance>(d)), total: count || 0 };
  }

  async getInstanceById(id: string) { return super.fetchById<FormInstance>('form_instances', id); }

  async createInstance(instance: Partial<FormInstance>, userId?: string) {
    return super.insertRecord<FormInstance>('form_instances', instance, userId);
  }

  async updateInstance(id: string, updates: Partial<FormInstance>, userId?: string) {
    return super.updateRecord<FormInstance>('form_instances', id, updates, userId);
  }
}
