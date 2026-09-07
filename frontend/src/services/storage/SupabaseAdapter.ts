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

  private mapFromDb(row: any): UserAccount {
    return {
      id: row.id,
      username: row.username,
      name: row.name || row.full_name || row.username,
      role: row.role || 'employee',
      branchId: row.branch_id || row.branchId || '',
      position: row.position || '',
      phone: row.phone || '',
      isActive: row.is_active ?? row.isActive ?? true,
      lastLogin: row.last_login || row.lastLogin,
      createdAt: row.created_at || row.createdAt || new Date().toISOString(),
      ...(row.password ? { password: row.password } : {}),
    } as UserAccount;
  }

  private mapToDb(account: Partial<UserAccount>): any {
    const dbObj: any = {};
    if (account.id) dbObj.id = account.id;
    if (account.username) dbObj.username = account.username;
    if (account.name) dbObj.name = account.name;
    if ((account as any).password) dbObj.password = (account as any).password;
    if (account.role) dbObj.role = account.role;
    if (account.branchId !== undefined) dbObj.branch_id = account.branchId;
    if (account.position !== undefined) dbObj.position = account.position;
    if (account.phone !== undefined) dbObj.phone = account.phone;
    if (account.isActive !== undefined) dbObj.is_active = account.isActive;
    return dbObj;
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
    return (data || []).map((row) => this.mapFromDb(row));
  }

  async createUserAccount(accountData: Partial<UserAccount>): Promise<UserAccount> {
    const payload = this.mapToDb(accountData);
    if (!payload.password) payload.password = '123456';
    if (payload.is_active === undefined) payload.is_active = true;

    const { data, error } = await supabase.from('user_accounts').insert([payload]).select();
    if (error) throw error;
    return this.mapFromDb(data[0]);
  }

  async toggleAccountStatus(username: string): Promise<UserAccount> {
    const accounts = await this.getUserAccounts();
    const current = accounts.find((a) => a.username === username);
    const newStatus = current ? !current.isActive : false;

    const { data, error } = await supabase
      .from('user_accounts')
      .update({ is_active: newStatus })
      .eq('username', username)
      .select();

    if (error) throw error;
    return this.mapFromDb(data[0]);
  }

  async updatePassword(username: string, newPassword: string): Promise<UserAccount> {
    const { data, error } = await supabase
      .from('user_accounts')
      .update({ password: newPassword })
      .eq('username', username)
      .select();

    if (error) throw error;
    return this.mapFromDb(data[0]);
  }

  async deleteUserAccount(username: string): Promise<boolean> {
    const { error } = await supabase.from('user_accounts').delete().eq('username', username);
    if (error) throw error;
    return true;
  }
}