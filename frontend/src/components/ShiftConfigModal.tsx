import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { ShiftConfig } from '../types';

interface ShiftConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: ShiftConfig[];
  onAdd: (input: Omit<ShiftConfig, 'id'>) => Promise<void>;
  onEdit: (shiftId: string, changes: Partial<Omit<ShiftConfig, 'id'>>) => Promise<void>;
  onRemove: (shiftId: string) => Promise<void>;
}

const emptyForm: Omit<ShiftConfig, 'id'> = {
  name: '',
  startTime: '08:00',
  endTime: '17:00',
  gracePeriodMinutes: 5,
};

/**
 * Modal cho phép người quản trị tự thêm/sửa/xoá ca làm việc bất cứ lúc
 * nào - đây chính là nơi hiện thực hoá yêu cầu "không hardcode giờ ca".
 */
export function ShiftConfigModal({ isOpen, onClose, shifts, onAdd, onEdit, onRemove }: ShiftConfigModalProps) {
  const [form, setForm] = useState<Omit<ShiftConfig, 'id'>>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const startEdit = (shift: ShiftConfig) => {
    setEditingId(shift.id);
    setForm({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      gracePeriodMinutes: shift.gracePeriodMinutes,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    if (editingId) {
      await onEdit(editingId, form);
    } else {
      await onAdd(form);
    }
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[var(--color-surface)] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">Cấu hình ca làm việc</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-black/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Danh sách ca hiện có */}
        <div className="mb-5 max-h-56 space-y-2 overflow-y-auto">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-[var(--color-ink)]">{shift.name}</p>
                <p className="text-xs text-[var(--color-ink-soft)]">
                  {shift.startTime} – {shift.endTime} · Trễ cho phép {shift.gracePeriodMinutes} phút
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(shift)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-[var(--color-primary-dark)] hover:bg-[var(--color-accent)]/10"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(shift.id)}
                  className="rounded-md p-1.5 text-[var(--color-red)] hover:bg-[var(--color-red-bg)]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {shifts.length === 0 && (
            <p className="py-4 text-center text-sm text-[var(--color-ink-soft)]">Chưa có ca làm việc nào.</p>
          )}
        </div>

        {/* Form thêm mới / chỉnh sửa */}
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4">
          <p className="mb-3 text-sm font-medium text-[var(--color-ink)]">
            {editingId ? 'Chỉnh sửa ca' : 'Thêm ca mới'}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tên ca"
              className="col-span-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] sm:col-span-1"
            />
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
            />
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
            />
            <input
              type="number"
              min={0}
              value={form.gracePeriodMinutes}
              onChange={(e) => setForm({ ...form, gracePeriodMinutes: Number(e.target.value) })}
              placeholder="Phút trễ cho phép"
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-black/5"
              >
                Huỷ
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <Plus size={16} />
              {editingId ? 'Lưu thay đổi' : 'Thêm ca'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
