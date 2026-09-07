import { useState } from 'react';
import { X, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (oldPass: string, newPass: string) => Promise<void>;
  userName: string;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSubmit,
  userName,
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!oldPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setError('Mật khẩu mới phải có ít nhất 4 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(oldPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đổi mật khẩu thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <KeyRound size={18} />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-[var(--color-ink)]">
                Đổi mật khẩu cá nhân
              </h3>
              <p className="text-xs text-[var(--color-ink-soft)]">Tài khoản: {userName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)] hover:text-[var(--color-ink)]"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--color-red)]/30 bg-[var(--color-red-bg)] p-3 text-xs text-[var(--color-red)]">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50 p-3 text-xs text-emerald-700">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>Đổi mật khẩu thành công!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Nhập mật khẩu đang dùng"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 4 ký tự"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
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
              disabled={isSubmitting || success}
              className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
