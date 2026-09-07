import { CalendarDays } from 'lucide-react';
import { DEFAULT_BRANCHES, ALL_BRANCHES_FILTER } from '../constants/branches';

interface BranchDateFilterProps {
  branchFilter: string;
  onBranchChange: (branchId: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

/** Bộ chọn nhanh chi nhánh (dạng pill) kết hợp bộ chọn ngày xem dữ liệu. */
export function BranchDateFilter({
  branchFilter,
  onBranchChange,
  selectedDate,
  onDateChange,
}: BranchDateFilterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <FilterPill
          label="Tất cả"
          isActive={branchFilter === ALL_BRANCHES_FILTER}
          onClick={() => onBranchChange(ALL_BRANCHES_FILTER)}
        />
        {DEFAULT_BRANCHES.map((branch) => (
          <FilterPill
            key={branch.id}
            label={branch.name}
            isActive={branchFilter === branch.id}
            onClick={() => onBranchChange(branch.id)}
          />
        ))}
      </div>

      <label className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink-soft)]">
        <CalendarDays size={16} />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="bg-transparent text-[var(--color-ink)] outline-none"
        />
      </label>
    </div>
  );
}

function FilterPill({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        isActive
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary-dark)]'
      }`}
    >
      {label}
    </button>
  );
}
