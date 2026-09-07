import { useState } from 'react';
import { Zap, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Sparkles, ShieldCheck, UserCheck } from 'lucide-react';
import type { UserAccount } from '../types';

interface LoginScreenProps {
  accounts: UserAccount[];
  onLogin: (username: string, pass: string) => Promise<void>;
  onQuickSwitch: (username: string) => Promise<void>;
}

export function LoginScreen({ accounts, onLogin, onQuickSwitch }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onLogin(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSelect = async (uname: string, pass: string) => {
    setUsername(uname);
    setPassword(pass);
    setError(null);
    setIsSubmitting(true);
    try {
      await onLogin(uname, pass);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20">
            <Zap size={28} strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
            Xe Điện Thanh Tươi
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">
            Hệ thống điểm danh & quản lý tài khoản nhân viên
          </p>
        </div>

        {/* Card Đăng nhập */}
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl shadow-black/[0.03]">
          <div className="p-6 sm:p-8">
            <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
              Đăng nhập tài khoản
            </h2>
            <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
              Nhập tài khoản cá nhân của bạn để vào ca hoặc quản lý
            </p>

            {error && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[var(--color-red)]/30 bg-[var(--color-red-bg)] p-3 text-xs text-[var(--color-red)]">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--color-ink-soft)]">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ví dụ: admin hoặc nv001"
                    autoComplete="username"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 pl-10 pr-3 text-sm text-[var(--color-ink)] outline-none transition-all placeholder:text-[var(--color-ink-soft)]/50 focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
                  Mật khẩu
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--color-ink-soft)]">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 pl-10 pr-10 text-sm text-[var(--color-ink)] outline-none transition-all placeholder:text-[var(--color-ink-soft)]/50 focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3.5 text-sm font-semibold text-white shadow-md shadow-[var(--color-primary)]/20 transition-all hover:bg-[var(--color-primary-dark)] hover:shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Đang kiểm tra...</span>
                ) : (
                  <>
                    <span>Đăng nhập hệ thống</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Selector */}
          <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)]/60 p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
                <Sparkles size={14} className="text-[var(--color-accent)]" /> Đăng nhập nhanh để test
              </span>
              <span className="text-[11px] text-[var(--color-ink-soft)]">1 chạm là vào</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoSelect('admin', 'admin123')}
                className="flex flex-col items-start rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-left transition-all hover:border-[var(--color-primary)] hover:shadow-sm"
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-[var(--color-primary-dark)]">
                  <ShieldCheck size={14} /> Admin Quản Lý
                </div>
                <div className="text-[11px] text-[var(--color-ink-soft)] mt-0.5">admin / admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('nv001', '123456')}
                className="flex flex-col items-start rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-left transition-all hover:border-[var(--color-primary)] hover:shadow-sm"
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-[var(--color-ink)]">
                  <UserCheck size={14} /> NV Văn An (Chợ Mới)
                </div>
                <div className="text-[11px] text-[var(--color-ink-soft)] mt-0.5">nv001 / 123456</div>
              </button>
            </div>

            {/* Account selector dropdown */}
            <div className="mt-3">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onQuickSwitch(e.target.value);
                  }
                }}
                defaultValue=""
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
              >
                <option value="" disabled>
                  Hoặc chọn nhanh tài khoản khác trong danh sách...
                </option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.username}>
                    {acc.role === 'admin' ? '👑 [Admin]' : `👤 [${acc.employeeId || 'NV'}]`}{' '}
                    {acc.name} ({acc.username}) {!acc.isActive ? '- ĐANG BỊ KHOÁ' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-[var(--color-ink-soft)]">
          Chuỗi cửa hàng Xe Điện Thanh Tươi · An Giang & Đồng Tháp
        </p>
      </div>
    </div>
  );
}
