import type { IStorageAdapter } from './StorageAdapter';
import type { UserAccount } from '../../types';
import { supabase } from '../supabaseClient';

class LocalStorageAdapter<T = any> implements IStorageAdapter<T> {
  private storageKey: string;
  private defaultData: any;

  constructor(storageKey: string = 'tt_default', defaultData: any = []) {
    this.storageKey = storageKey;
    this.defaultData = defaultData;
  }

  async getAll(): Promise<T[]> {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      if (this.defaultData) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.defaultData));
        return this.defaultData as T[];
      }
      return [];
    }
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
        {
          id: 'acc_admin',
          username: 'admin',
          name: 'Admin Quản Trị',
          role: 'admin',
          isActive: true,
          branchId: 'b_chomoi',
          createdAt: new Date().toISOString(),
        } as UserAccount,
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
      id: account.id || `acc_${Date.now()}`,
      username: account.username || `user_${Date.now()}`,
      name: account.name || account.username || '',
      password: (account as any).password || '123456',
      role: account.role || 'employee',
      branchId: account.branchId || '',
      position: account.position || '',
      phone: account.phone || '',
      isActive: account.isActive ?? true,
      createdAt: new Date().toISOString(),
    } as UserAccount;
    list.unshift(newAcc);
    localStorage.setItem('tt_user_accounts', JSON.stringify(list));
    return newAcc;
  }

  async toggleAccountStatus(username: string): Promise<UserAccount> {
    const list = await this.getUserAccounts();
    const item = list.find((u) => u.username === username);
    if (!item) throw new Error('Không tìm thấy tài khoản');
    item.isActive = !item.isActive;
    localStorage.setItem('tt_user_accounts', JSON.stringify(list));
    return item;
  }

  async updatePassword(username: string, newPassword: string): Promise<UserAccount> {
    const list = await this.getUserAccounts();
    const item = list.find((u) => u.username === username);
    if (!item) throw new Error('Không tìm thấy tài khoản');
    (item as any).password = newPassword;
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

  constructor(tableName: string = 'user_accounts', _defaultData?: any) {
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

const storageMode = import.meta.env.VITE_STORAGE_MODE || 'local';

export const createAdapter = <T = any>(key?: string, defaultData?: any): IStorageAdapter<T> => {
  if (storageMode === 'supabase') {
    return new SupabaseStorageAdapter<T>(key, defaultData);
  }
  return new LocalStorageAdapter<T>(key, defaultData);
};

export const getStorageAdapter = createAdapter;