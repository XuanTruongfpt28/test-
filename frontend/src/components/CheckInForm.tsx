import { useEffect, useMemo, useState } from 'react';
import { LogIn, LogOut, Sparkles } from 'lucide-react';
import type { Employee, ShiftConfig } from '../types';
import { DEFAULT_BRANCHES } from '../constants/branches';
import { suggestNearestShift } from '../utils/timeUtils';
import { StatusBadge } from './StatusBadge';

interface CheckInFormProps {
  employees: Employee[];
  shifts: ShiftConfig[];
  onCheckIn: (employee: Employee, shift: ShiftConfig) => Promise<void>;
  onCheckOut: (employee: Employee) => Promise<void>;
}

interface FeedbackState {
  kind: 'success' | 'error';
  message: string;
}

/**
 * Màn hình Kiosk dùng cho nhân viên tự bấm Check-in/Check-out tại quầy.
 * Thiết kế nút bấm lớn, thao tác tối thiểu (chọn chi nhánh -> chọn tên
 * -> chọn ca -> bấm nút), phù hợp dùng trên tablet đặt tại cửa hàng.
 */
export function CheckInForm({ employees, shifts, onCheckIn, onCheckOut }: CheckInFormProps) {
  const [branchId, setBranchId] = useState(DEFAULT_BRANCHES[0]?.id ?? '');
  const [employeeId, setEmployeeId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const employeesInBranch = useMemo(
    () => employees.filter((e) => e.branchId === branchId),
    [employees, branchId],
  );

  const selectedEmployee = employeesInBranch.find((e) => e.id === employeeId);
  const selectedShift = shifts.find((s) => s.id === shiftId);

  // Khi đổi chi nhánh, tự chọn nhân viên đầu tiên trong danh sách mới.
  useEffect(() => {
    setEmployeeId(employeesInBranch[0]?.id ?? '');
  }, [employeesInBranch]);

  // Tự gợi ý ca gần nhất với giờ hiện tại mỗi khi danh sách ca sẵn sàng.
  useEffect(() => {
    const suggested = suggestNearestShift(shifts);
    setShiftId(suggested?.id ?? '');
  }, [shifts]);

  const handleAction = async (action: 'in' | 'out') => {
    if (!selectedEmployee) {
      setFeedback({ kind: 'error', message: 'Vui lòng chọn nhân viên.' });
      return;
    }
    if (action === 'in' && !selectedShift) {
      setFeedback({ kind: 'error', message: 'Vui lòng chọn ca làm việc.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      if (action === 'in' && selectedShift) {
        await onCheckIn(selectedEmployee, selectedShift);
        setFeedback({ kind: 'success', message: `Đã check-in cho ${selectedEmployee.name}.` });
      } else {
        await onCheckOut(selectedEmployee);
        setFeedback({ kind: 'success', message: `Đã check-out cho ${selectedEmployee.name}.` });
      }
    } catch (error) {
      setFeedback({ kind: 'error', message: error instanceof Error ? error.message : 'Có lỗi xảy ra.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
      <div className="mb-6 text-center">
        <h2 className="font-display text-xl font-bold text-[var(--color-ink)]">Điểm danh ca làm việc</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Chọn chi nhánh, tên và ca để bắt đầu</p>
      </div>

      <div className="space-y-4">
        <Field label="Chi nhánh">
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
          >
            {DEFAULT_BRANCHES.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Nhân viên">
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
          >
            {employeesInBranch.length === 0 && <option value="">Không có nhân viên</option>}
            {employeesInBranch.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.id} · {employee.name}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label={
            <span className="flex items-center gap-1.5">
              Ca làm việc
              <span className="inline-flex items-center gap-1 text-xs font-normal text-[var(--color-primary-dark)]">
                <Sparkles size={12} /> gợi ý theo giờ hiện tại
              </span>
            </span>
          }
        >
          <select
            value={shiftId}
            onChange={(e) => setShiftId(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
          >
            {shifts.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {shift.name} ({shift.startTime} - {shift.endTime})
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting || !selectedEmployee}
            onClick={() => handleAction('in')}
            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <LogIn size={18} />
            Check-in (Vào ca)
          </button>
          <button
            type="button"
            disabled={isSubmitting || !selectedEmployee}
            onClick={() => handleAction('out')}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-[var(--color-primary)] px-4 py-4 text-sm font-semibold text-[var(--color-primary-dark)] transition-colors hover:bg-[var(--color-accent)]/10 disabled:opacity-50"
          >
            <LogOut size={18} />
            Check-out (Tan ca)
          </button>
        </div>

        {feedback && (
          <div className="pt-1 text-center">
            <StatusBadge tone={feedback.kind === 'success' ? 'primary' : 'red'}>
              {feedback.message}
            </StatusBadge>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">{label}</span>
      {children}
    </label>
  );
}
