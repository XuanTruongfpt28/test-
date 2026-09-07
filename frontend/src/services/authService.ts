import { createAdapter } from './storage/adapterFactory';
import { STORAGE_KEYS } from './storage/StorageAdapter';
import type { UserAccount } from './storage/StorageAdapter';

const adapter = createAdapter<UserAccount>(STORAGE_KEYS.ACCOUNTS);
const SESSION_KEY = 'tt_session';

export const getAllAccounts = async (): Promise<UserAccount[]> => {
  return await adapter.getUserAccounts();
};

export const createEmployeeAccount = async (accountData: Partial<UserAccount>): Promise<UserAccount> => {
  return await adapter.createUserAccount(accountData);
};

export const updateAccount = async (username: string, updates: Partial<UserAccount>): Promise<UserAccount> => {
  if (typeof updates.is_active === 'boolean') {
    await adapter.toggleAccountStatus(username, updates.is_active);
  }
  if (updates.password) {
    await adapter.updatePassword(username, updates.password);
  }
  const all = await adapter.getUserAccounts();
  return all.find((a) => a.username === username) || (updates as UserAccount);
};

export const toggleAccountLock = async (username: string, currentStatus: boolean): Promise<UserAccount> => {
  return await adapter.toggleAccountStatus(username, !currentStatus);
};

export const resetPassword = async (username: string, newPass: string): Promise<UserAccount> => {
  return await adapter.updatePassword(username, newPass);
};

export const deleteAccount = async (username: string): Promise<boolean> => {
  return await adapter.deleteUserAccount(username);
};

export const login = async (username: string, pass: string): Promise<UserAccount | null> => {
  const accounts = await adapter.getUserAccounts();
  const found = accounts.find((a) => a.username === username && a.password === pass);
  if (!found) {
    throw new Error('Sai tài khoản hoặc mật khẩu');
  }
  if (!found.is_active) {
    throw new Error('Tài khoản đã bị khóa');
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(found));
  return found;
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem(SESSION_KEY);
};

export const getCurrentSession = (): UserAccount | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const authService = {
  getAllAccounts,
  createEmployeeAccount,
  updateAccount,
  toggleAccountLock,
  resetPassword,
  deleteAccount,
  login,
  logout,
  getCurrentSession,
};

export default authService;