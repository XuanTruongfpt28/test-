import { Users, UserCheck, Clock3, UserX } from 'lucide-react';
import type { AttendanceStats } from '../types';

interface StatsCardProps {
  stats: AttendanceStats;
}

/** Dải 4 thẻ thống kê nhanh: Tổng nhân viên, Đang có mặt, Đi muộn, Vắng mặt. */
export function StatsCard({ stats }: StatsCardProps) {
  const items = [
    { label: 'Tổng nhân viên', value: stats.totalEmployees, icon: Users, tone: 'neutral' as const },
    { label: 'Đang có mặt', value: stats.present, icon: UserCheck, tone: 'primary' as const },
    { label: 'Đi muộn', value: stats.late, icon: Clock3, tone: 'amber' as const },
    { label: 'Vắng mặt', value: stats.absent, icon: UserX, tone: 'red' as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ label, value, icon: Icon, tone }) => (
        <div
          key={label}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        >
          <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${toneBg(tone)}`}>
            <Icon size={16} className={toneText(tone)} />
          </div>
          <p className="font-display text-2xl font-bold text-[var(--color-ink)]">{value}</p>
          <p className="text-xs text-[var(--color-ink-soft)]">{label}</p>
        </div>
      ))}
    </div>
  );
}

function toneBg(tone: 'neutral' | 'primary' | 'amber' | 'red') {
  switch (tone) {
    case 'primary':
      return 'bg-[var(--color-accent)]/15';
    case 'amber':
      return 'bg-[var(--color-amber-bg)]';
    case 'red':
      return 'bg-[var(--color-red-bg)]';
    default:
      return 'bg-black/5';
  }
}

function toneText(tone: 'neutral' | 'primary' | 'amber' | 'red') {
  switch (tone) {
    case 'primary':
      return 'text-[var(--color-primary-dark)]';
    case 'amber':
      return 'text-[var(--color-amber)]';
    case 'red':
      return 'text-[var(--color-red)]';
    default:
      return 'text-[var(--color-ink-soft)]';
  }
}
