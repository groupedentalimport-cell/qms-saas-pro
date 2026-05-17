import { BaseService } from './base-service';
import type { Profile } from '@/qms/types/qms';

export class ProfileService extends BaseService {
  async list() {
    const { data, error } = await this.supabase.from('profiles').select('*');
    if (error) throw new Error(error.message);
    return (data || []).map(d => this.mapToCamel<Profile>(d));
  }

  async getById(id: string) { return super.fetchById<Profile>('profiles', id); }

  async create(profile: Partial<Profile>, userId?: string) {
    return super.insertRecord<Profile>('profiles', profile, userId);
  }

  async update(id: string, updates: Partial<Profile>, userId?: string) {
    return super.updateRecord<Profile>('profiles', id, updates, userId);
  }
}
