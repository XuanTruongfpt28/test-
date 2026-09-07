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

export const STORAGE_KEYS = {
  ATTENDANCE: 'tt_attendance_records',
  EMPLOYEES: 'tt_employees',
  BRANCHES: 'tt_branches',
  SHIFTS: 'tt_shifts',
  ACCOUNTS: 'tt_user_accounts',
} as const;

export interface IStorageAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  
  // Xóa bỏ các dấu '?' để TypeScript không báo undefined
  getUserAccounts(): Promise<UserAccount[]>;
  createUserAccount(account: Partial<UserAccount>): Promise<UserAccount>;
  toggleAccountStatus(username: string, isActive: boolean): Promise<UserAccount>;
  updatePassword(username: string, newPassword: string): Promise<UserAccount>;
  deleteUserAccount(username: string): Promise<boolean>;

  getEmployees?(): Promise<any[]>;
  getBranches?(): Promise<any[]>;
}

export type StorageAdapter = IStorageAdapter;