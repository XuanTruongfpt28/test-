import { getStorageAdapter } from './storage/adapterFactory';
import type { UserAccount } from './storage/StorageAdapter';

const storage = getStorageAdapter();

export const authService = {
  // Lấy toàn bộ danh sách tài khoản
  async getAccounts(): Promise<UserAccount[]> {
    return await storage.getUserAccounts();
  },

  // Thêm tài khoản mới
  async createAccount(data: Partial<UserAccount>): Promise<UserAccount> {
    return await storage.createUserAccount(data);
  },

  // Đổi trạng thái Khoá / Mở
  async toggleLock(username: string, currentStatus: boolean): Promise<UserAccount> {
    return await storage.toggleAccountStatus(username, !currentStatus);
  },

  // Đổi mật khẩu
  async updatePassword(username: string, newPass: string): Promise<UserAccount> {
    return await storage.updatePassword(username, newPass);
  },

  // Xoá tài khoản
  async deleteAccount(username: string): Promise<boolean> {
    return await storage.deleteUserAccount(username);
  },
};