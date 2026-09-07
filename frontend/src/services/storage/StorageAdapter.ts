import type { UserAccount } from '../../types';

export const STORAGE_KEYS = {
  ATTENDANCE: 'tt_attendance_records',
  ATTENDANCE_RECORDS: 'tt_attendance_records',
  EMPLOYEES: 'tt_employees',
  BRANCHES: 'tt_branches',
  SHIFTS: 'tt_shifts',
  SHIFT_CONFIGS: 'tt_shift_configs',
  ACCOUNTS: 'tt_user_accounts',
} as const;

export interface IStorageAdapter<T = any> {
  getAll(): Promise<T[]>;
  saveAll(items: T[]): Promise<void>;
  getItem<U = T>(key: string): Promise<U | null>;
  setItem<U = T>(key: string, value: U): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;

  getUserAccounts(): Promise<UserAccount[]>;
  createUserAccount(account: Partial<UserAccount>): Promise<UserAccount>;
  toggleAccountStatus(username: string): Promise<UserAccount>;
  updatePassword(username: string, newPassword: string): Promise<UserAccount>;
  deleteUserAccount(username: string): Promise<boolean>;
}

export type StorageAdapter<T = any> = IStorageAdapter<T>;
export type { UserAccount };