/**
 * useAuth.ts
 * ----------
 * Hook quản lý trạng thái xác thực và phân quyền người dùng (Admin vs Nhân viên).
 * Cung cấp toàn bộ hành động liên quan đến tài khoản và quản lý tài khoản con.
 */
import { useCallback, useEffect, useState } from 'react';
import type { UserAccount } from '../types';
import {
  changePersonalPassword as serviceChangePassword,
  createEmployeeAccount as serviceCreateAccount,
  deleteAccount as serviceDeleteAccount,
  getAllAccounts,
  getCurrentSession,
  login as serviceLogin,
  logout as serviceLogout,
  resetPassword as serviceResetPassword,
  toggleAccountLock as serviceToggleLock,
  updateAccount as serviceUpdateAccount,
} from '../services/authService';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tải phiên đăng nhập và danh sách tài khoản khi khởi tạo
  const refreshAccounts = useCallback(async () => {
    try {
      const all = await getAllAccounts();
      setAccounts(all);
      const session = getCurrentSession();
      if (session) {
        // Cập nhật session mới nhất từ danh sách tài khoản
        const latestUser = all.find((acc) => acc.id === session.id);
        if (latestUser && latestUser.isActive) {
          setCurrentUser(latestUser);
        } else {
          // Tài khoản đã bị khoá hoặc xoá -> tự động đăng xuất
          await serviceLogout();
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  const login = useCallback(
    async (username: string, pass: string) => {
      const user = await serviceLogin(username, pass);
      setCurrentUser(user);
      await refreshAccounts();
      return user;
    },
    [refreshAccounts],
  );

  const logout = useCallback(async () => {
    await serviceLogout();
    setCurrentUser(null);
  }, []);

  const quickSwitch = useCallback(
    async (username: string) => {
      const all = await getAllAccounts();
      const target = all.find((a) => a.username.toLowerCase() === username.toLowerCase());
      if (!target) throw new Error('Không tìm thấy tài khoản.');
      return login(target.username, target.password);
    },
    [login],
  );

  const createAccount = useCallback(
    async (params: {
      username: string;
      password: string;
      name: string;
      branchId: string;
      position?: string;
      phone?: string;
      employeeId?: string;
    }) => {
      const created = await serviceCreateAccount(params);
      await refreshAccounts();
      return created;
    },
    [refreshAccounts],
  );

  const updateAccount = useCallback(
    async (
      id: string,
      updates: Partial<Pick<UserAccount, 'name' | 'branchId' | 'position' | 'phone' | 'isActive'>>,
    ) => {
      const updated = await serviceUpdateAccount(id, updates);
      await refreshAccounts();
      return updated;
    },
    [refreshAccounts],
  );

  const toggleAccountLock = useCallback(
    async (id: string) => {
      const updated = await serviceToggleLock(id);
      await refreshAccounts();
      return updated;
    },
    [refreshAccounts],
  );

  const resetAccountPassword = useCallback(
    async (id: string, newPass: string) => {
      await serviceResetPassword(id, newPass);
      await refreshAccounts();
    },
    [refreshAccounts],
  );

  const changePersonalPassword = useCallback(
    async (oldPass: string, newPass: string) => {
      if (!currentUser) throw new Error('Chưa đăng nhập.');
      await serviceChangePassword(currentUser.id, oldPass, newPass);
      await refreshAccounts();
    },
    [currentUser, refreshAccounts],
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      await serviceDeleteAccount(id);
      await refreshAccounts();
    },
    [refreshAccounts],
  );

  return {
    currentUser,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'admin',
    isEmployee: currentUser?.role === 'employee',
    accounts,
    isLoading,
    login,
    logout,
    quickSwitch,
    createAccount,
    updateAccount,
    toggleAccountLock,
    resetAccountPassword,
    changePersonalPassword,
    deleteAccount,
    refreshAccounts,
  };
}
