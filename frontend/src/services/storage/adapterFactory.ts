import type { IStorageAdapter, UserAccount } from './StorageAdapter';
import { SupabaseAdapter } from './SupabaseAdapter';

class LocalStorageAdapter implements IStorageAdapter {
  private key = 'tt_user_accounts';

  private getList(): UserAccount[] {
    const raw = localStorage.getItem(this.key);
    if (!raw) {
      const initial: UserAccount[] = [
        { username: 'admin', role: 'admin', is_active: true, branch_id: 'b_chomoi' },
        { username: 'nv001', role: 'employee', is_active: true, branch_id: 'b_chomoi' },
      ];
      localStorage.setItem(this.key, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveList(list: UserAccount[]): void {
    localStorage.setItem(this.key, JSON.stringify(list));
  }

  async getItem<T>(key: string): Promise<T | null> {
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }

  async getUserAccounts(): Promise<UserAccount[]> {
    return this.getList();
  }

  async createUserAccount(account: Partial<UserAccount>): Promise<UserAccount> {
    const list = this.getList();
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
    this.saveList(list);
    return newAcc;
  }

  async toggleAccountStatus(username: string, isActive: boolean): Promise<UserAccount> {
    const list = this.getList();
    const item = list.find((u) => u.username === username);
    if (!item) throw new Error('Không tìm thấy tài khoản');
    item.is_active = isActive;
    this.saveList(list);
    return item;
  }

  async updatePassword(username: string, newPassword: string): Promise<UserAccount> {
    const list = this.getList();
    const item = list.find((u) => u.username === username);
    if (!item) throw new Error('Không tìm thấy tài khoản');
    item.password = newPassword;
    this.saveList(list);
    return item;
  }

  async deleteUserAccount(username: string): Promise<boolean> {
    let list = this.getList();
    list = list.filter((u) => u.username !== username);
    this.saveList(list);
    return true;
  }
}

const storageMode = import.meta.env.VITE_STORAGE_MODE || 'local';
let adapterInstance: IStorageAdapter | null = null;

export const createAdapter = (): IStorageAdapter => {
  if (!adapterInstance) {
    if (storageMode === 'supabase') {
      adapterInstance = new SupabaseAdapter();
    } else {
      adapterInstance = new LocalStorageAdapter();
    }
  }
  return adapterInstance!;
};

export const getStorageAdapter = createAdapter;