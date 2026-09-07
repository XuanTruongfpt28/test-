import { supabase } from '../supabaseClient';
import type { IStorageAdapter, UserAccount } from './StorageAdapter';

export class SupabaseAdapter<T = any> implements IStorageAdapter<T> {
  private tableName: string;

  constructor(tableName: string = 'user_accounts') {
    this.tableName = tableName;
  }

  private getTable(): string {
    const clean = this.tableName.replace(/^tt_/, '');
    if (clean === 'accounts') return 'user_accounts';
    return clean;
  }

  async getAll(): Promise<T[]> {
    const { data, error } = await supabase.from(this.getTable()).select('*');
    if (error) {
      console.warn(`Lỗi lấy dữ liệu bảng ${this.getTable()}:`, error.message);
      return [];
    }
    return (data || []) as T[];
  }

  async saveAll(items: T[]): Promise<void> {
    if (!items || items.length === 0) return;
    const { error } = await supabase.from(this.getTable()).upsert(items as any);
    if (error) {
      console.error(`Lỗi ghi dữ liệu bảng ${this.getTable()}:`, error.message);
    }
  }

  async getItem<U = T>(key: string): Promise<U | null> {
    const { data, error } = await supabase.from(key).select('*');
    if (error) return null;
    return data as unknown as U;
  }

  async setItem<U = T>(key: string, value: U): Promise<void> {
    await supabase.from(key).upsert(value as any);
  }

  async removeItem(_key: string): Promise<void> {}

  async clear(): Promise<void> {}

  async getUserAccounts(): Promise<UserAccount[]> {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createUserAccount(accountData: Partial<UserAccount>): Promise<UserAccount> {
    const payload = {
      username: accountData.username,
      password: accountData.password || '123456',
      role: accountData.role || 'employee',
      branch_id: accountData.branch_id || null,
      employee_id: accountData.employee_id || null,
      is_active: accountData.is_active ?? true,
    };

    const { data, error } = await supabase.from('user_accounts').insert([payload]).select();
    if (error) throw error;
    return data[0];
  }

  async toggleAccountStatus(username: string, isActive: boolean): Promise<UserAccount> {
    const { data, error } = await supabase
      .from('user_accounts')
      .update({ is_active: isActive })
      .eq('username', username)
      .select();

    if (error) throw error;
    return data[0];
  }

  async updatePassword(username: string, newPassword: string): Promise<UserAccount> {
    const { data, error } = await supabase
      .from('user_accounts')
      .update({ password: newPassword })
      .eq('username', username)
      .select();

    if (error) throw error;
    return data[0];
  }

  async deleteUserAccount(username: string): Promise<boolean> {
    const { error } = await supabase.from('user_accounts').delete().eq('username', username);
    if (error) throw error;
    return true;
  }
}