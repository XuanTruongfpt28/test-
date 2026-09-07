/**
 * authService.ts
 * --------------
 * Dịch vụ xác thực và quản lý tài khoản người dùng cho Xe Điện Thanh Tươi.
 * Hỗ trợ phân quyền Quản trị viên (Admin) và Nhân viên (tài khoản cá nhân con).
 */
import type { UserAccount } from '../types';
import { DEFAULT_EMPLOYEES } from '../constants/employees';
import { STORAGE_KEYS, type IStorageAdapter } from './storage/StorageAdapter';
import { createAdapter } from './storage/adapterFactory';
import { removeEmployee, upsertEmployee } from './employeeService';

const accountAdapter: IStorageAdapter<UserAccount> = createAdapter<UserAccount>(
  STORAGE_KEYS.USER_ACCOUNTS,
  'user_accounts',
);

/** Danh sách tài khoản khởi tạo mẫu (Seed data) */
const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr_admin',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Quản trị viên Hệ thống',
    position: 'Tổng Quản lý',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  ...DEFAULT_EMPLOYEES.map((emp) => ({
    id: `usr_${emp.id.toLowerCase()}`,
    username: emp.id.toLowerCase(),
    password: '123456',
    role: 'employee' as const,
    employeeId: emp.id,
    name: emp.name,
    branchId: emp.branchId,
    position: emp.position,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  })),
];

/** Lấy toàn bộ tài khoản trong hệ thống. Tự động seed nếu lần đầu chạy. */
export async function getAllAccounts(): Promise<UserAccount[]> {
  const accounts = await accountAdapter.getAll();
  if (accounts.length === 0) {
    await accountAdapter.saveAll(DEFAULT_ACCOUNTS);
    return DEFAULT_ACCOUNTS;
  }
  return accounts;
}

/** Lấy phiên đăng nhập hiện tại từ LocalStorage (nếu có). */
export function getCurrentSession(): UserAccount | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    if (!raw) return null;
    return JSON.parse(raw) as UserAccount;
  } catch {
    return null;
  }
}

/** Lưu phiên đăng nhập hiện tại. */
function setCurrentSession(user: UserAccount | null): void {
  if (user) {
    window.localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  }
}

/** Đăng nhập bằng tên đăng nhập và mật khẩu. */
export async function login(username: string, password: string): Promise<UserAccount> {
  const accounts = await getAllAccounts();
  const cleanUsername = username.trim().toLowerCase();

  const user = accounts.find((acc) => acc.username.toLowerCase() === cleanUsername);
  if (!user) {
    throw new Error('Tên đăng nhập không tồn tại trong hệ thống.');
  }

  if (user.password !== password) {
    throw new Error('Mật khẩu không chính xác.');
  }

  if (!user.isActive) {
    throw new Error(
      'Tài khoản này đã bị Quản trị viên tạm khoá. Vui lòng liên hệ quản lý để được kích hoạt lại.',
    );
  }

  const updatedUser: UserAccount = {
    ...user,
    lastLoginAt: new Date().toISOString(),
  };

  // Cập nhật lastLoginAt trong kho lưu trữ
  const updatedAccounts = accounts.map((acc) => (acc.id === user.id ? updatedUser : acc));
  await accountAdapter.saveAll(updatedAccounts);

  // Lưu phiên đăng nhập
  setCurrentSession(updatedUser);

  return updatedUser;
}

/** Đăng xuất khỏi hệ thống. */
export async function logout(): Promise<void> {
  setCurrentSession(null);
}

/** Dành cho Admin: Tạo tài khoản nhân viên con mới. */
export async function createEmployeeAccount(params: {
  username: string;
  password: string;
  name: string;
  branchId: string;
  position?: string;
  phone?: string;
  employeeId?: string;
}): Promise<UserAccount> {
  const accounts = await getAllAccounts();
  const cleanUsername = params.username.trim().toLowerCase();

  if (!cleanUsername) {
    throw new Error('Tên đăng nhập không được để trống.');
  }

  if (accounts.some((acc) => acc.username.toLowerCase() === cleanUsername)) {
    throw new Error(`Tên đăng nhập "${cleanUsername}" đã được sử dụng.`);
  }

  if (!params.password || params.password.length < 4) {
    throw new Error('Mật khẩu phải có ít nhất 4 ký tự.');
  }

  // Tự sinh mã NV nếu không truyền vào (ví dụ: NV009, NV010...)
  let employeeId = params.employeeId?.trim().toUpperCase();
  if (!employeeId) {
    const existingEmpNumbers = accounts
      .map((acc) => acc.employeeId)
      .filter((id): id is string => !!id && id.startsWith('NV'))
      .map((id) => parseInt(id.replace('NV', ''), 10))
      .filter((num) => !isNaN(num));

    const maxNum = existingEmpNumbers.length > 0 ? Math.max(...existingEmpNumbers) : 8;
    employeeId = `NV${String(maxNum + 1).padStart(3, '0')}`;
  }

  const newAccount: UserAccount = {
    id: `usr_${Date.now()}`,
    username: cleanUsername,
    password: params.password,
    role: 'employee',
    employeeId,
    name: params.name.trim(),
    branchId: params.branchId,
    position: params.position?.trim() || 'Nhân viên',
    phone: params.phone?.trim(),
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  // Đồng bộ sang bảng Employee để các tính năng kiosk & báo cáo nhận diện
  await upsertEmployee({
    id: employeeId,
    name: newAccount.name,
    branchId: newAccount.branchId!,
    position: newAccount.position,
  });

  await accountAdapter.saveAll([...accounts, newAccount]);
  return newAccount;
}

/** Dành cho Admin: Cập nhật thông tin tài khoản con. */
export async function updateAccount(
  accountId: string,
  updates: Partial<Pick<UserAccount, 'name' | 'branchId' | 'position' | 'phone' | 'isActive'>>,
): Promise<UserAccount> {
  const accounts = await getAllAccounts();
  const target = accounts.find((acc) => acc.id === accountId);
  if (!target) {
    throw new Error('Không tìm thấy tài khoản cần cập nhật.');
  }

  const updated: UserAccount = {
    ...target,
    ...updates,
  };

  const newAccounts = accounts.map((acc) => (acc.id === accountId ? updated : acc));
  await accountAdapter.saveAll(newAccounts);

  // Nếu là nhân viên, cập nhật thông tin tương ứng ở bảng Employee
  if (updated.employeeId && updated.branchId) {
    await upsertEmployee({
      id: updated.employeeId,
      name: updated.name,
      branchId: updated.branchId,
      position: updated.position,
    });
  }

  // Nếu tài khoản đang đăng nhập là chính tài khoản được cập nhật, đồng bộ session
  const current = getCurrentSession();
  if (current && current.id === accountId) {
    setCurrentSession(updated);
  }

  return updated;
}

/** Dành cho Admin: Khoá hoặc Mở khoá tài khoản con. */
export async function toggleAccountLock(accountId: string): Promise<UserAccount> {
  const accounts = await getAllAccounts();
  const target = accounts.find((acc) => acc.id === accountId);
  if (!target) {
    throw new Error('Không tìm thấy tài khoản.');
  }

  if (target.role === 'admin') {
    throw new Error('Không thể khoá tài khoản Quản trị viên chính.');
  }

  const newStatus = !target.isActive;
  return updateAccount(accountId, { isActive: newStatus });
}

/** Dành cho Admin: Đặt lại mật khẩu cho tài khoản con. */
export async function resetPassword(accountId: string, newPassword: string): Promise<void> {
  if (!newPassword || newPassword.length < 4) {
    throw new Error('Mật khẩu mới phải có ít nhất 4 ký tự.');
  }

  const accounts = await getAllAccounts();
  const target = accounts.find((acc) => acc.id === accountId);
  if (!target) {
    throw new Error('Không tìm thấy tài khoản.');
  }

  const updated: UserAccount = {
    ...target,
    password: newPassword,
  };

  const newAccounts = accounts.map((acc) => (acc.id === accountId ? updated : acc));
  await accountAdapter.saveAll(newAccounts);
}

/** Người dùng tự đổi mật khẩu cá nhân. */
export async function changePersonalPassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  if (!newPassword || newPassword.length < 4) {
    throw new Error('Mật khẩu mới phải có ít nhất 4 ký tự.');
  }

  const accounts = await getAllAccounts();
  const target = accounts.find((acc) => acc.id === userId);
  if (!target) {
    throw new Error('Không tìm thấy thông tin tài khoản.');
  }

  if (target.password !== oldPassword) {
    throw new Error('Mật khẩu hiện tại không đúng.');
  }

  const updated: UserAccount = {
    ...target,
    password: newPassword,
  };

  const newAccounts = accounts.map((acc) => (acc.id === userId ? updated : acc));
  await accountAdapter.saveAll(newAccounts);

  // Cập nhật session hiện tại
  setCurrentSession(updated);
}

/** Dành cho Admin: Xoá tài khoản con. */
export async function deleteAccount(accountId: string): Promise<void> {
  const accounts = await getAllAccounts();
  const target = accounts.find((acc) => acc.id === accountId);
  if (!target) {
    throw new Error('Không tìm thấy tài khoản để xoá.');
  }

  if (target.role === 'admin') {
    throw new Error('Không được phép xoá tài khoản Quản trị viên hệ thống.');
  }

  const filtered = accounts.filter((acc) => acc.id !== accountId);
  await accountAdapter.saveAll(filtered);

  if (target.employeeId) {
    await removeEmployee(target.employeeId);
  }
}
