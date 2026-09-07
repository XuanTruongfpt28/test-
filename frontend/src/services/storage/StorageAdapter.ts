export interface UserAccount {
  id?: string;
  username: string;
  password?: string;
  role: string;
  branch_id?: string;
  employee_id?: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
}

export interface StorageAdapter {
  // Quản lý tài khoản
  getUserAccounts(): Promise<UserAccount[]>;
  createUserAccount(account: Partial<UserAccount>): Promise<UserAccount>;
  toggleAccountStatus(username: string, isActive: boolean): Promise<UserAccount>;
  updatePassword(username: string, newPassword: string): Promise<UserAccount>;
  deleteUserAccount(username: string): Promise<boolean>;

  // Thao tác phụ trợ (nếu có)
  getEmployees?(): Promise<any[]>;
  getBranches?(): Promise<any[]>;
}