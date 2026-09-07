/**
 * adapterFactory.ts
 * ------------------
 * Điểm quyết định DUY NHẤT: dùng LocalStorageAdapter (offline, 1 máy)
 * hay SupabaseAdapter (đồng bộ nhiều máy/nhiều chi nhánh qua backend).
 *
 * Đổi bằng biến môi trường VITE_STORAGE_MODE trong `.env`:
 *   VITE_STORAGE_MODE=local      -> LocalStorageAdapter (mặc định, không cần backend)
 *   VITE_STORAGE_MODE=supabase   -> SupabaseAdapter (cần VITE_SUPABASE_URL/ANON_KEY)
 *
 * Các service (attendanceStorage.ts, authService.ts, employeeService.ts,
 * shiftService.ts, branchService.ts) gọi `createAdapter<T>(key, table)`
 * thay vì tự `new LocalStorageAdapter(...)` trực tiếp.
 */
import { LocalStorageAdapter, type IStorageAdapter } from './StorageAdapter';
import { SupabaseAdapter } from './SupabaseAdapter';

const STORAGE_MODE = import.meta.env.VITE_STORAGE_MODE ?? 'local';

/**
 * @param localStorageKey Key dùng khi ở chế độ 'local' (giữ nguyên STORAGE_KEYS.* cũ)
 * @param supabaseTable Tên bảng Postgres tương ứng khi ở chế độ 'supabase'
 */
export function createAdapter<T extends { id: string }>(
  localStorageKey: string,
  supabaseTable: string,
): IStorageAdapter<T> {
  if (STORAGE_MODE === 'supabase') {
    return new SupabaseAdapter<T>(supabaseTable);
  }
  return new LocalStorageAdapter<T>(localStorageKey);
}
