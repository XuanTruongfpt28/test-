import { supabase } from '../supabaseClient';
import { StorageAdapter, UserAccount } from './StorageAdapter';

export class SupabaseAdapter implements StorageAdapter {
  // Lấy toàn bộ danh sách tài khoản
  async getUserAccounts(): Promise<UserAccount[]> {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SupabaseAdapter] Lỗi lấy danh sách tài khoản:', error);
      throw error;
    }
    return data || [];
  }

  // Cấp tài khoản mới
  async createUserAccount(accountData: Partial<UserAccount>): Promise<UserAccount> {
    const payload = {
      username: accountData.username,
      password: accountData.password || '123456',
      role: accountData.role || 'employee',
      branch_id: accountData.branch_id || null,
      employee_id: accountData.employee_id || null,
      is_active: accountData.is_active ?? true,
    };

    const { data, error } = await supabase
      .from('user_accounts')
      .insert([payload])
      .select();

    if (error) {
      console.error('[SupabaseAdapter] Lỗi thêm tài khoản:', error);
      throw error;
    }
    return data[0];
  }

  // Khóa / Mở khóa tài khoản
  async toggleAccountStatus(username: string, isActive: boolean): Promise<UserAccount> {
    const { data, error } = await supabase
      .from('user_accounts')
      .update({ is_active: isActive })
      .eq('username', username)
      .select();

    if (error) {
      console.error('[SupabaseAdapter] Lỗi cập nhật trạng thái tài khoản:', error);
      throw error;
    }
    return data[0];
  }

  // Đổi mật khẩu
  async updatePassword(username: string, newPassword: string): Promise<UserAccount> {
    const { data, error } = await supabase
      .from('user_accounts')
      .update({ password: newPassword })
      .eq('username', username)
      .select();

    if (error) {
      console.error('[SupabaseAdapter] Lỗi cập nhật mật khẩu:', error);
      throw error;
    }
    return data[0];
  }

  // Xoá tài khoản
  async deleteUserAccount(username: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_accounts')
      .delete()
      .eq('username', username);

    if (error) {
      console.error('[SupabaseAdapter] Lỗi xoá tài khoản:', error);
      throw error;
    }
    return true;
  }
}