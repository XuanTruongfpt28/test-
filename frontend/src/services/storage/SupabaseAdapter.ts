/**
 * ============================================================
 *  SUPABASE ADAPTER
 * ============================================================
 * Cài đặt `IStorageAdapter<T>` bằng Supabase (Postgres qua PostgREST),
 * thay thế cho `LocalStorageAdapter`. Vì implement CÙNG interface,
 * mọi service (`attendanceStorage.ts`, `authService.ts`,
 * `employeeService.ts`, `shiftService.ts`, `branchService.ts`) không
 * cần sửa gì thêm ngoài việc đổi adapter được khởi tạo — xem
 * `adapterFactory.ts`.
 *
 * Lưu ý: `getAll()/saveAll()` mô phỏng đúng ngữ nghĩa "đọc/ghi đè toàn
 * bộ collection" của bản localStorage cũ, nên phù hợp cho các bảng nhỏ
 * (branches, employees, shift_configs, user_accounts). Với
 * `attendance_records` — bảng sẽ phình to theo thời gian — cách này vẫn
 * chạy đúng nhưng không tối ưu; khi dữ liệu lớn, nên viết thêm các hàm
 * CRUD tăng trưởng (insert một record, update theo id) thay vì
 * saveAll() toàn bộ mảng mỗi lần ghi.
 */
import { supabase } from '../supabaseClient';
import type { IStorageAdapter } from './StorageAdapter';

/** "checkInTime" -> "check_in_time" */
function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** "check_in_time" -> "checkInTime" */
function toCamelCase(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase());
}

function rowToItem<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== null) result[toCamelCase(key)] = value;
  }
  return result as T;
}

function itemToRow<T extends object>(item: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    result[toSnakeCase(key)] = value;
  }
  return result;
}

export class SupabaseAdapter<T extends { id: string }> implements IStorageAdapter<T> {
  constructor(private readonly table: string) {}

  async getAll(): Promise<T[]> {
    const { data, error } = await supabase.from(this.table).select('*');
    if (error) {
      console.error(`[SupabaseAdapter] Lỗi đọc bảng "${this.table}":`, error);
      return [];
    }
    return (data ?? []).map((row) => rowToItem<T>(row));
  }

  async saveAll(items: T[]): Promise<void> {
    const rows = items.map((item) => itemToRow(item));

    if (rows.length > 0) {
      const { error: upsertError } = await supabase.from(this.table).upsert(rows);
      if (upsertError) {
        console.error(`[SupabaseAdapter] Lỗi ghi bảng "${this.table}":`, upsertError);
        throw upsertError;
      }
    }

    // Xoá các dòng không còn xuất hiện trong `items` (mô phỏng "ghi đè toàn bộ").
    const currentIds = items.map((item) => item.id);
    const deleteQuery =
      currentIds.length > 0
        ? supabase.from(this.table).delete().not('id', 'in', `(${currentIds.join(',')})`)
        : supabase.from(this.table).delete().neq('id', '__none__'); // xoá hết nếu items rỗng

    const { error: deleteError } = await deleteQuery;
    if (deleteError) {
      console.error(`[SupabaseAdapter] Lỗi xoá bảng "${this.table}":`, deleteError);
      throw deleteError;
    }
  }
}
