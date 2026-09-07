import type { StorageAdapter, UserAccount } from './StorageAdapter';
import { SupabaseAdapter } from './SupabaseAdapter';

// Fallback Adapter dành riêng cho localStorage khi chạy offline
class LocalStorageAdapter implements StorageAdapter {
  private key = 'tt_user_accounts';

  private getList(): UserAccount[] {
    const raw = localStorage.getItem(this.key);
    if (!raw) {
      // Dữ liệu mẫu ban đầu
      const initial: UserAccount[] = [
        { username: 'admin', role: 'admin', is_active: true, branch_id: 'b_chomoi' },
        { username: 'nv001', role: 'employee', is_active: true, branch_id: 'b_chomoi' },
      ];
      localStorage.setItem(this.key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  }

  private saveList(list: UserAccount[]): void {
    localStorage.setItem(this.key, JSON.stringify(list));
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

// Kiểm tra biến môi trường
const storageMode = import.meta.env.VITE_STORAGE_MODE || 'local';
let currentAdapter: StorageAdapter | null = null;

export const getStorageAdapter = (): StorageAdapter => {
  if (!currentAdapter) {
    if (storageMode === 'supabase') {
      console.log('⚡ [Storage Adapter] Đang chạy với SUPABASE Database.');
      currentAdapter = new SupabaseAdapter();
    } else {
      console.log('📁 [Storage Adapter] Đang chạy với LOCALSTORAGE (Offline).');
      currentAdapter = new LocalStorageAdapter();
    }
  }
  return currentAdapter;
};