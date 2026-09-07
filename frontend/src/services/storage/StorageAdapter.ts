/**
 * ============================================================
 *  STORAGE ADAPTER (Repository / Adapter Pattern)
 * ============================================================
 * Đây là "hợp đồng" (interface) trừu tượng cho việc đọc/ghi một danh
 * sách dữ liệu dưới một "collection key" (ví dụ: "attendance_records",
 * "shift_configs"...).
 *
 * Toàn bộ phần còn lại của ứng dụng (services/*, hooks/*) CHỈ được
 * phép làm việc thông qua interface `IStorageAdapter<T>` này, KHÔNG
 * bao giờ gọi thẳng `localStorage.getItem` ở nơi khác.
 *
 * => Khi cần chuyển sang REST API hoặc Supabase, bạn chỉ cần viết một
 *    class mới (ví dụ `RestApiAdapter` hoặc `SupabaseAdapter`) implement
 *    cùng interface này, rồi đổi một dòng khởi tạo duy nhất trong
 *    `src/services/container.ts`. Toàn bộ services/hooks/components
 *    phía trên không cần sửa gì cả.
 */
export interface IStorageAdapter<T> {
  /** Lấy toàn bộ danh sách bản ghi thuộc collection */
  getAll(): Promise<T[]>;
  /** Ghi đè toàn bộ danh sách bản ghi (dùng khi thêm/sửa/xoá) */
  saveAll(items: T[]): Promise<void>;
}

/**
 * Cài đặt cụ thể của IStorageAdapter sử dụng trình duyệt LocalStorage.
 * Đây là adapter mặc định cho giai đoạn phát triển / offline-first,
 * dữ liệu được lưu bền vững ngay trên máy trình duyệt.
 */
export class LocalStorageAdapter<T> implements IStorageAdapter<T> {
  private readonly storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  async getAll(): Promise<T[]> {
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as T[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error(`[LocalStorageAdapter] Lỗi đọc key "${this.storageKey}":`, error);
      return [];
    }
  }

  async saveAll(items: T[]): Promise<void> {
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch (error) {
      console.error(`[LocalStorageAdapter] Lỗi ghi key "${this.storageKey}":`, error);
      throw error;
    }
  }
}

/**
 * Các key LocalStorage tập trung tại một nơi để tránh gõ nhầm chuỗi
 * rải rác khắp codebase (magic string).
 */
export const STORAGE_KEYS = {
  ATTENDANCE_RECORDS: 'thanhtuoi_attendance_records',
  SHIFT_CONFIGS: 'thanhtuoi_shift_configs',
  EMPLOYEES: 'thanhtuoi_employees',
  USER_ACCOUNTS: 'thanhtuoi_user_accounts',
  CURRENT_SESSION: 'thanhtuoi_current_session',
  BRANCHES: 'thanhtuoi_branches',
} as const;

