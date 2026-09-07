/**
 * shiftService.ts
 * ---------------
 * Toàn bộ nghiệp vụ CRUD cấu hình ca làm việc. Không được gọi thẳng
 * localStorage ở đây hay ở component - luôn đi qua `IStorageAdapter`.
 */
import type { ShiftConfig } from '../types';
import { STORAGE_KEYS, type IStorageAdapter } from './storage/StorageAdapter';
import { createAdapter } from './storage/adapterFactory';
import { DEFAULT_SHIFTS } from '../constants/shifts';

const adapter: IStorageAdapter<ShiftConfig> = createAdapter<ShiftConfig>(
  STORAGE_KEYS.SHIFT_CONFIGS,
  'shift_configs',
);

/** Lấy danh sách ca làm việc. Nếu chưa có dữ liệu, khởi tạo bằng DEFAULT_SHIFTS. */
export async function getShifts(): Promise<ShiftConfig[]> {
  const shifts = await adapter.getAll();
  if (shifts.length === 0) {
    await adapter.saveAll(DEFAULT_SHIFTS);
    return DEFAULT_SHIFTS;
  }
  return shifts;
}

/** Tạo mới một ca làm việc, sinh id tự động. */
export async function createShift(input: Omit<ShiftConfig, 'id'>): Promise<ShiftConfig> {
  const shifts = await getShifts();
  const newShift: ShiftConfig = { ...input, id: `shift_${Date.now()}` };
  await adapter.saveAll([...shifts, newShift]);
  return newShift;
}

/** Cập nhật một ca làm việc theo id. */
export async function updateShift(shiftId: string, changes: Partial<Omit<ShiftConfig, 'id'>>): Promise<void> {
  const shifts = await getShifts();
  const updated = shifts.map((shift) => (shift.id === shiftId ? { ...shift, ...changes } : shift));
  await adapter.saveAll(updated);
}

/** Xoá một ca làm việc theo id. */
export async function deleteShift(shiftId: string): Promise<void> {
  const shifts = await getShifts();
  await adapter.saveAll(shifts.filter((shift) => shift.id !== shiftId));
}
