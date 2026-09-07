import type { ReactNode } from 'react';

type BadgeTone = 'primary' | 'amber' | 'red' | 'blue' | 'neutral';

const TONE_CLASSES: Record<BadgeTone, string> = {
  primary: 'bg-[var(--color-accent)]/15 text-[var(--color-primary-dark)]',
  amber: 'bg-[var(--color-amber-bg)] text-[var(--color-amber)]',
  red: 'bg-[var(--color-red-bg)] text-[var(--color-red)]',
  blue: 'bg-[var(--color-blue-bg)] text-[var(--color-blue)]',
  neutral: 'bg-black/5 text-[var(--color-ink-soft)]',
};

interface StatusBadgeProps {
  tone: BadgeTone;
  children: ReactNode;
}

/** Nhãn trạng thái nhỏ gọn, tái sử dụng ở bảng chấm công và màn hình Kiosk. */
export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
