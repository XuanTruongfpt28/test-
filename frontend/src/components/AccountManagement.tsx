import { useMemo, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Lock,
  Unlock,
  KeyRound,
  Edit2,
  Trash2,
  Shield,
  UserCheck,
  Building2,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react';
import type { UserAccount } from '../types';
import { DEFAULT_BRANCHES, ALL_BRANCHES_FILTER } from '../constants/branches';

interface AccountManagementProps {
  accounts: UserAccount[];
  onCreateAccount: (data: {
    username: string;
    password: string;
    name: string;
    branchId: string;
    position?: string;
    phone?: string;
    employeeId?: string;
  }) => Promise<unknown>;
  onUpdateAccount: (
    id: string,
    updates: Partial<Pick<UserAccount, 'name' | 'branchId' | 'position' | 'phone' | 'isActive'>>,
  ) => Promise<unknown>;
  onToggleLock: (id: string) => Promise<unknown>;
  onResetPassword: (id: string, newPass: string) => Promise<unknown>;
  onDeleteAccount: (id: string) => Promise<unknown>;
}

export function AccountManagement({
  accounts,
  onCreateAccount,
  onUpdateAccount,
  onToggleLock,
  onResetPassword,
  onDeleteAccount,
}: AccountManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState(ALL_BRANCHES_FILTER);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'LOCKED'>('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [resettingAccount, setResettingAccount] = useState<UserAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<UserAccount | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Branch map for quick lookup
  const branchMap = useMemo(() => {
    const map = new Map<string, string>();
    DEFAULT_BRANCHES.forEach((b) => map.set(b.id, b.name));
    return map;
  }, []);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // Branch filter
      if (branchFilter !== ALL_BRANCHES_FILTER && acc.branchId !== branchFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'ACTIVE' && !acc.isActive) return false;
      if (statusFilter === 'LOCKED' && acc.isActive) return false;
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchName = acc.name.toLowerCase().includes(term);
        const matchUser = acc.username.toLowerCase().includes(term);
        const matchEmpId = acc.employeeId?.toLowerCase().includes(term);
        const matchPos = acc.position?.toLowerCase().includes(term);
        return matchName || matchUser || matchEmpId || matchPos;
      }
      return true;
    });
  }, [accounts, branchFilter, statusFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = accounts.length;
    const employeesCount = accounts.filter((a) => a.role === 'employee').length;
    const activeCount = accounts.filter((a) => a.isActive).length;
    const lockedCount = accounts.filter((a) => !a.isActive).length;
    return { total, employeesCount, activeCount, lockedCount };
  }, [accounts]);

  const handleToggleLock = async (acc: UserAccount) => {
    try {
      await onToggleLock(acc.id);
      showNotice(
        'success',
        acc.isActive
          ? `Đã khoá tài khoản của ${acc.name}.`
          : `Đã mở khoá tài khoản của ${acc.name}.`,
      );
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Thao tác thất bại.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl p-4 shadow-xl text-sm font-medium transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Banner & Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-[var(--color-ink)]">
            Kiểm soát tài khoản nhân viên (Tài khoản con)
          </h2>
          <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
            Phân quyền cá nhân, cấp phát thông tin đăng nhập và quản trị trạng thái tài khoản
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-primary-dark)]"
        >
          <UserPlus size={16} />
          <span>+ Cấp tài khoản nhân viên mới</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[var(--color-ink-soft)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng tài khoản</span>
            <Users size={16} className="text-[var(--color-primary)]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[var(--color-ink)]">{stats.total}</div>
          <div className="text-[11px] text-[var(--color-ink-soft)] mt-0.5">
            {stats.employeesCount} tài khoản con nhân viên
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-semibold uppercase tracking-wider">Đang hoạt động</span>
            <UserCheck size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">{stats.activeCount}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Cho phép đăng nhập</div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-red-800">
            <span className="text-xs font-semibold uppercase tracking-wider">Đang bị khoá</span>
            <Lock size={16} className="text-red-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-700">{stats.lockedCount}</div>
          <div className="text-[11px] text-red-600 mt-0.5">Bị chặn đăng nhập</div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[var(--color-ink-soft)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Chi nhánh</span>
            <Building2 size={16} className="text-[var(--color-blue)]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[var(--color-ink)]">4</div>
          <div className="text-[11px] text-[var(--color-ink-soft)] mt-0.5">Chợ Mới, Lấp Vò, ML 3&4</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--color-ink-soft)]">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, mã nhân viên, tên đăng nhập hoặc chức vụ..."
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2 pl-9 pr-3 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Branch filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
          >
            <option value={ALL_BRANCHES_FILTER}>Tất cả chi nhánh</option>
            {DEFAULT_BRANCHES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'LOCKED')}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đã bị khoá</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--color-ink)]">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 text-[var(--color-ink-soft)]">
              <tr>
                <th className="py-3.5 pl-5 pr-3 font-semibold uppercase tracking-wider">Nhân viên</th>
                <th className="py-3.5 px-3 font-semibold uppercase tracking-wider">Tài khoản đăng nhập</th>
                <th className="py-3.5 px-3 font-semibold uppercase tracking-wider">Chi nhánh & Chức danh</th>
                <th className="py-3.5 px-3 font-semibold uppercase tracking-wider">Trạng thái</th>
                <th className="py-3.5 px-3 font-semibold uppercase tracking-wider">Lần đăng nhập cuối</th>
                <th className="py-3.5 pl-3 pr-5 text-right font-semibold uppercase tracking-wider">Kiểm soát</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[var(--color-ink-soft)]">
                    Không tìm thấy tài khoản nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const isMainAdmin = acc.role === 'admin';
                  return (
                    <tr
                      key={acc.id}
                      className={`transition-colors hover:bg-[var(--color-bg)]/40 ${
                        !acc.isActive ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* Nhân viên Info */}
                      <td className="py-3.5 pl-5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs ${
                              isMainAdmin
                                ? 'bg-amber-100 text-amber-800'
                                : acc.isActive
                                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary-dark)]'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {acc.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-medium text-[var(--color-ink)]">
                              <span>{acc.name}</span>
                              {isMainAdmin && (
                                <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                  <Shield size={10} /> ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[var(--color-ink-soft)]">
                              {acc.employeeId ? `Mã: ${acc.employeeId}` : 'Tài khoản hệ thống'}
                              {acc.phone && ` · ${acc.phone}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono rounded-md bg-[var(--color-bg)] px-2 py-1 text-[11px] font-semibold text-[var(--color-primary-dark)]">
                          {acc.username}
                        </span>
                      </td>

                      {/* Chi nhánh & Chức danh */}
                      <td className="py-3.5 px-3">
                        <div className="font-medium text-[var(--color-ink)]">
                          {acc.branchId ? branchMap.get(acc.branchId) || acc.branchId : 'Toàn hệ thống'}
                        </div>
                        <div className="text-[11px] text-[var(--color-ink-soft)]">
                          {acc.position || 'Nhân viên'}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-3">
                        {acc.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                            Đã bị khoá
                          </span>
                        )}
                      </td>

                      {/* Lần đăng nhập cuối */}
                      <td className="py-3.5 px-3 text-[11px] text-[var(--color-ink-soft)]">
                        {acc.lastLoginAt
                          ? new Date(acc.lastLoginAt).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                            })
                          : 'Chưa đăng nhập'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Nút Khoá / Mở khoá */}
                          {!isMainAdmin && (
                            <button
                              type="button"
                              onClick={() => handleToggleLock(acc)}
                              title={acc.isActive ? 'Khoá tài khoản con này' : 'Mở khoá tài khoản'}
                              className={`rounded-lg p-1.5 transition-colors ${
                                acc.isActive
                                  ? 'text-[var(--color-ink-soft)] hover:bg-red-50 hover:text-red-600'
                                  : 'bg-red-100 text-red-700 hover:bg-emerald-100 hover:text-emerald-700'
                              }`}
                            >
                              {acc.isActive ? <Lock size={15} /> : <Unlock size={15} />}
                            </button>
                          )}

                          {/* Nút Đặt lại mật khẩu */}
                          <button
                            type="button"
                            onClick={() => setResettingAccount(acc)}
                            title="Đặt lại mật khẩu cho tài khoản này"
                            className="rounded-lg p-1.5 text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)]"
                          >
                            <KeyRound size={15} />
                          </button>

                          {/* Nút Chỉnh sửa thông tin */}
                          <button
                            type="button"
                            onClick={() => setEditingAccount(acc)}
                            title="Chỉnh sửa thông tin tài khoản"
                            className="rounded-lg p-1.5 text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-blue)]"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Nút Xoá */}
                          {!isMainAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeletingAccount(acc)}
                              title="Xoá tài khoản nhân viên"
                              className="rounded-lg p-1.5 text-[var(--color-ink-soft)] transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Cấp tài khoản mới */}
      {isCreateOpen && (
        <CreateAccountModal
          onClose={() => setIsCreateOpen(false)}
          onSubmit={async (data) => {
            try {
              await onCreateAccount(data);
              setIsCreateOpen(false);
              showNotice('success', `Đã tạo tài khoản cho ${data.name}!`);
            } catch (err) {
              showNotice('error', err instanceof Error ? err.message : 'Tạo tài khoản thất bại.');
            }
          }}
        />
      )}

      {/* Modal 2: Chỉnh sửa thông tin tài khoản */}
      {editingAccount && (
        <EditAccountModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSubmit={async (updates) => {
            try {
              await onUpdateAccount(editingAccount.id, updates);
              setEditingAccount(null);
              showNotice('success', `Đã cập nhật thông tin cho ${editingAccount.name}!`);
            } catch (err) {
              showNotice('error', err instanceof Error ? err.message : 'Cập nhật thất bại.');
            }
          }}
        />
      )}

      {/* Modal 3: Đặt lại mật khẩu */}
      {resettingAccount && (
        <ResetPasswordModal
          account={resettingAccount}
          onClose={() => setResettingAccount(null)}
          onSubmit={async (newPass) => {
            try {
              await onResetPassword(resettingAccount.id, newPass);
              setResettingAccount(null);
              showNotice('success', `Đã đặt lại mật khẩu cho ${resettingAccount.name}!`);
            } catch (err) {
              showNotice('error', err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại.');
            }
          }}
        />
      )}

      {/* Modal 4: Xác nhận xoá tài khoản */}
      {deletingAccount && (
        <ConfirmDeleteModal
          account={deletingAccount}
          onClose={() => setDeletingAccount(null)}
          onConfirm={async () => {
            try {
              await onDeleteAccount(deletingAccount.id);
              setDeletingAccount(null);
              showNotice('success', `Đã xoá tài khoản ${deletingAccount.name}.`);
            } catch (err) {
              showNotice('error', err instanceof Error ? err.message : 'Xoá thất bại.');
            }
          }}
        />
      )}
    </div>
  );
}

// ================= MODAL SUB-COMPONENTS =================

function CreateAccountModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: {
    username: string;
    password: string;
    name: string;
    branchId: string;
    position?: string;
    phone?: string;
    employeeId?: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123456');
  const [branchId, setBranchId] = useState(DEFAULT_BRANCHES[0]?.id || '');
  const [position, setPosition] = useState('Nhân viên bán hàng');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErr('Vui lòng nhập họ và tên nhân viên.');
      return;
    }
    if (!username.trim()) {
      setErr('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (!password || password.length < 4) {
      setErr('Mật khẩu tối thiểu 4 ký tự.');
      return;
    }

    setIsSubmitting(true);
    setErr(null);
    try {
      await onSubmit({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password,
        branchId,
        position,
        phone: phone.trim() || undefined,
        employeeId: employeeId.trim() || undefined,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <UserPlus size={18} />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-[var(--color-ink)]">
                Cấp tài khoản nhân viên mới
              </h3>
              <p className="text-xs text-[var(--color-ink-soft)]">
                Tạo tài khoản con để nhân viên tự đăng nhập và điểm danh
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)]"
          >
            <X size={18} />
          </button>
        </div>

        {err && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
            <AlertTriangle size={15} />
            <span>{err}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                Họ và tên nhân viên *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Lê Thị Mai"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                Mã NV (để trống sẽ tự sinh)
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="VD: NV009"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                Chi nhánh cơ sở * <span className="text-[10px] font-normal text-[var(--color-ink-soft)]">(Nhân viên có thể đổi khi vào ca)</span>
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
              >
                {DEFAULT_BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                Chức vụ / Vị trí
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="VD: Bán hàng, Thu ngân, Kỹ thuật..."
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                Tên đăng nhập (username) *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="VD: nv009 hoặc lemai"
                className="w-full font-mono rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                Mật khẩu ban đầu *
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mặc định: 123456"
                className="w-full font-mono rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
              Số điện thoại (tuỳ chọn)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="VD: 0912345678"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditAccountModal({
  account,
  onClose,
  onSubmit,
}: {
  account: UserAccount;
  onClose: () => void;
  onSubmit: (updates: Partial<Pick<UserAccount, 'name' | 'branchId' | 'position' | 'phone' | 'isActive'>>) => Promise<void>;
}) {
  const [name, setName] = useState(account.name);
  const [branchId, setBranchId] = useState(account.branchId || DEFAULT_BRANCHES[0]?.id || '');
  const [position, setPosition] = useState(account.position || '');
  const [phone, setPhone] = useState(account.phone || '');
  const [isActive, setIsActive] = useState(account.isActive);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({
      name: name.trim(),
      branchId,
      position: position.trim(),
      phone: phone.trim() || undefined,
      isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <div>
            <h3 className="font-display text-base font-bold text-[var(--color-ink)]">
              Chỉnh sửa thông tin tài khoản
            </h3>
            <p className="text-xs text-[var(--color-ink-soft)]">
              Tài khoản: {account.username} ({account.employeeId || 'Hệ thống'})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
              Họ và tên
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
              Chi nhánh cơ sở <span className="text-[10px] font-normal text-[var(--color-ink-soft)]">(Nhân viên có thể đổi khi vào ca)</span>
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
            >
              {DEFAULT_BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
              Chức vụ / Vị trí
            </label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
              Số điện thoại
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {account.role !== 'admin' && (
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-0"
                />
                <span className="text-xs font-semibold text-[var(--color-ink)]">
                  Kích hoạt tài khoản (cho phép đăng nhập)
                </span>
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({
  account,
  onClose,
  onSubmit,
}: {
  account: UserAccount;
  onClose: () => void;
  onSubmit: (newPass: string) => Promise<void>;
}) {
  const [newPassword, setNewPassword] = useState('123456');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setErr('Mật khẩu phải có ít nhất 4 ký tự.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(newPassword);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lỗi đặt lại mật khẩu.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <KeyRound size={18} />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-[var(--color-ink)]">
                Đặt lại mật khẩu
              </h3>
              <p className="text-xs text-[var(--color-ink-soft)]">{account.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)]"
          >
            <X size={18} />
          </button>
        </div>

        {err && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
            <AlertTriangle size={15} />
            <span>{err}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
              Mật khẩu mới cho tài khoản <span className="font-mono text-[var(--color-primary-dark)]">{account.username}</span>
            </label>
            <input
              type="text"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              className="w-full font-mono rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Xác nhận đặt lại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({
  account,
  onClose,
  onConfirm,
}: {
  account: UserAccount;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
        <div className="flex items-center gap-3 text-red-600 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-[var(--color-ink)]">
              Xoá tài khoản nhân viên?
            </h3>
            <p className="text-xs text-red-600">Hành động này không thể hoàn tác</p>
          </div>
        </div>

        <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
          Bạn có chắc chắn muốn xoá tài khoản <strong className="text-[var(--color-ink)]">{account.name}</strong> ({account.username})? Nhân viên này sẽ không còn quyền đăng nhập vào hệ thống.
        </p>

        <div className="flex justify-end gap-2.5 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)]"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={async () => {
              setIsSubmitting(true);
              await onConfirm();
            }}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Đang xoá...' : 'Xoá vĩnh viễn'}
          </button>
        </div>
      </div>
    </div>
  );
}
