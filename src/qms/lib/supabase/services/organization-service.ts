import { BaseService } from './base-service';
import type { Organization } from '@/qms/types/qms';

export class OrganizationService extends BaseService {
  async list() {
    const { data, error } = await this.supabase.from('organizations').select('*');
    if (error) throw new Error(error.message);
    return (data || []).map(d => this.mapToCamel<Organization>(d));
  }

  async getById(id: string) { return super.fetchById<Organization>('organizations', id); }

  async create(org: Partial<Organization>, userId?: string) {
    return super.insertRecord<Organization>('organizations', org, userId);
  }

  async update(id: string, updates: Partial<Organization>, userId?: string) {
    return super.updateRecord<Organization>('organizations', id, updates, userId);
  }
}
