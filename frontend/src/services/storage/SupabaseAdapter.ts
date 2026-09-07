import { supabase } from '../supabaseClient';
import type { IStorageAdapter, UserAccount } from './StorageAdapter';

export class SupabaseAdapter implements IStorageAdapter {
  async getItem<T>(key: string): Promise<T | null> {
    const { data, error } = await supabase.from(key).select('*');
    if (error) return null;
    return data as unknown as T;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    await supabase.from(key).upsert(value as any);
  }

  async removeItem(_key: string): Promise<void> {
    // Không dùng ở chế độ Supabase
  }

  async clear(): Promise<void> {
    // Không dùng ở chế độ Supabase
  }

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