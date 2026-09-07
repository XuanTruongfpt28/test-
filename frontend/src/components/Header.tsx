import { Zap, LayoutGrid, Users, ScanLine, LogOut, KeyRound, Shield, UserCheck } from 'lucide-react';
import type { UserAccount } from '../types';
import { DEFAULT_BRANCHES } from '../constants/branches';

export type AppTab = 'admin-attendance' | 'admin-accounts' | 'kiosk' | 'employee-checkin';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  currentUser: UserAccount;
  accounts: UserAccount[];
  onLogout: () => void;
  onOpenChangePassword: () => void;
  onQuickSwitch: (username: string) => void;
}

export function Header({
  activeTab,
  onTabChange,
  currentUser,
  accounts,
  onLogout,
  onOpenChangePassword,
  onQuickSwitch,
}: HeaderProps) {
  const isAdmin = currentUser.role === 'admin';
  const branchObj = DEFAULT_BRANCHES.find((b) => b.id === currentUser.branchId);
  const branchName = branchObj ? branchObj.name : currentUser.branchId;

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-3.5 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-sm">
              <Zap size={20} strokeWidth={2.5} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base font-bold leading-tight text-[var(--color-ink)] sm:text-lg">
                  Xe Điện Thanh Tươi
                </h1>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    <Shield size={11} /> ADMIN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--color-primary-dark)]">
                    <UserCheck size={11} /> {currentUser.employeeId || 'NHÂN VIÊN'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-ink-soft)]">
                {isAdmin
                  ? 'Bảng điều khiển quản trị hệ thống'
                  : `${branchName || 'Linh hoạt'} (Luân phiên) · ${currentUser.position || 'Nhân viên'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Chỉ hiển thị cho Admin, nhân viên không cần tab để tránh rối mắt) */}
        {isAdmin && (
          <nav className="flex flex-wrap gap-1 rounded-xl bg-[var(--color-bg)] p-1">
            <TabButton
              label="Bảng chấm công"
              icon={<LayoutGrid size={15} />}
              isActive={activeTab === 'admin-attendance'}
              onClick={() => onTabChange('admin-attendance')}
            />
            <TabButton
              label="Quản lý tài khoản con"
              icon={<Users size={15} />}
              isActive={activeTab === 'admin-accounts'}
              onClick={() => onTabChange('admin-accounts')}
            />
            <TabButton
              label="Kiosk quầy"
              icon={<ScanLine size={15} />}
              isActive={activeTab === 'kiosk'}
              onClick={() => onTabChange('kiosk')}
            />
          </nav>
        )}

        {/* User Profile & Actions */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-2 lg:border-t-0 lg:pt-0">
          {/* Quick Demo Switcher */}
          <div className="hidden sm:block">
            <select
              value={currentUser.username}
              onChange={(e) => onQuickSwitch(e.target.value)}
              title="Chuyển nhanh tài khoản để test thử"
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-[11px] font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] cursor-pointer"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.username}>
                  {acc.role === 'admin' ? '👑 Admin' : `👤 ${acc.name} (${acc.employeeId || 'NV'})`}
                </option>
              ))}
            </select>
          </div>

          {/* User info & Logout */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-[var(--color-bg)] px-2.5 py-1.5 border border-[var(--color-border)]">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white font-bold text-[11px]">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[100px] truncate text-xs font-semibold text-[var(--color-ink)] sm:max-w-[130px]">
                {currentUser.name}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenChangePassword}
              title="Đổi mật khẩu"
              className="rounded-lg p-2 text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-ink)]"
            >
              <KeyRound size={16} />
            </button>

            <button
              type="button"
              onClick={onLogout}
              title="Đăng xuất khỏi hệ thống"
              className="flex items-center gap-1 rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={16} />
              <span className="text-xs font-semibold hidden md:inline">Thoát</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function TabButton({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
        isActive
          ? 'bg-[var(--color-surface)] text-[var(--color-primary-dark)] shadow-xs'
          : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
