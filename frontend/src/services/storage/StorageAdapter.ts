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
  SHIFT_CONFIGS: 'tt_shift_configs',
  ACCOUNTS: 'tt_user_accounts',
} as const;

export interface IStorageAdapter<T = any> {
  // Các phương thức đồng bộ danh sách đối tượng
  getAll(): Promise<T[]>;
  saveAll(items: T[]): Promise<void>;

  // Các phương thức CRUD cơ bản theo key
  getItem<U = T>(key: string): Promise<U | null>;
  setItem<U = T>(key: string, value: U): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;

  // Nghiệp vụ tài khoản người dùng
  getUserAccounts(): Promise<UserAccount[]>;
  createUserAccount(account: Partial<UserAccount>): Promise<UserAccount>;
  toggleAccountStatus(username: string, isActive: boolean): Promise<UserAccount>;
  updatePassword(username: string, newPassword: string): Promise<UserAccount>;
  deleteUserAccount(username: string): Promise<boolean>;
}

export type StorageAdapter<T = any> = IStorageAdapter<T>;