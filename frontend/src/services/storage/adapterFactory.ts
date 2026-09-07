import type { IStorageAdapter, UserAccount } from './StorageAdapter';
import { supabase } from '../supabaseClient';

class LocalStorageAdapter<T = any> implements IStorageAdapter<T> {
  private storageKey: string;

  constructor(storageKey: string = 'tt_default') {
    this.storageKey = storageKey;
  }

  async getAll(): Promise<T[]> {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }

  async saveAll(items: T[]): Promise<void> {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  async getItem<U = T>(key: string): Promise<U | null> {
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as U;
    } catch {
      return data as unknown as U;
    }
  }

  async setItem<U = T>(key: string, value: U): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }

  async getUserAccounts(): Promise<UserAccount[]> {
    const raw = localStorage.getItem('tt_user_accounts');
    if (!raw) {
      const initial: UserAccount[] = [
        { username: 'admin', role: 'admin', is_active: true, branch_id: 'b_chomoi' },
        { username: 'nv001', role: 'employee', is_active: true, branch_id: 'b_chomoi' },
      ];
      localStorage.setItem('tt_user_accounts', JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async createUserAccount(account: Partial<UserAccount>): Promise<UserAccount> {
    const list = await this.getUserAccounts();
    const newAcc: UserAccount = {
      username: account.username || `user_${Date.now()}`,
      password: account.password || '123456',
      role: account.role || 'employee',
      branch_id: account.branch_id,
      employee_id: account.employee_id,
      is_active: account.is_active ?? true,
      created_at: new Date().toISOString(),
    };
    list.unshift(newAcc);
    localStorage.setItem('tt_user_accounts', JSON.stringify(list));
    return newAcc;
  }

  async toggleAccountStatus(username: string, isActive: boolean): Promise<UserAccount> {
    const list = await this.getUserAccounts();
    const item = list.find((u) => u.username === username);
    if (!item) throw new Error('Không tìm thấy tài khoản');
    item.is_active = isActive;
    localStorage.setItem('tt_user_accounts', JSON.stringify(list));
    return item;
  }

  async updatePassword(username: string, newPassword: string): Promise<UserAccount> {
    const list = await this.getUserAccounts();
    const item = list.find((u) => u.username === username);
    if (!item) throw new Error('Không tìm thấy tài khoản');
    item.password = newPassword;
    localStorage.setItem('tt_user_accounts', JSON.stringify(list));
    return item;
  }

  async deleteUserAccount(username: string): Promise<boolean> {
    let list = await this.getUserAccounts();
    list = list.filter((u) => u.username !== username);
    localStorage.setItem('tt_user_accounts', JSON.stringify(list));
    return true;
  }
}

class SupabaseStorageAdapter<T = any> implements IStorageAdapter<T> {
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

const storageMode = import.meta.env.VITE_STORAGE_MODE || 'local';

export const createAdapter = <T = any>(key?: string): IStorageAdapter<T> => {
  if (storageMode === 'supabase') {
    return new SupabaseStorageAdapter<T>(key);
  }
  return new LocalStorageAdapter<T>(key);
};

export const getStorageAdapter = createAdapter;