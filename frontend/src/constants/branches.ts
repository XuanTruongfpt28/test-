import type { Branch } from '../types';

/**
 * Danh sách 4 chi nhánh mặc định của chuỗi cửa hàng Xe Điện Thanh Tươi.
 * Đây là dữ liệu khởi tạo (seed data) - trong tương lai khi kết nối
 * backend thật, danh sách này có thể được thay thế bằng dữ liệu từ API.
 */
export const DEFAULT_BRANCHES: Branch[] = [
  { id: 'CN_CHO_MOI', name: 'Cửa hàng Chợ Mới' },
  { id: 'CN_LAP_VO', name: 'Cửa hàng Lấp Vò' },
  { id: 'CN_MY_LUONG_3', name: 'Cửa hàng Mỹ Luông 3' },
  { id: 'CN_MY_LUONG_4', name: 'Cửa hàng Mỹ Luông 4' },
];

/** Giá trị đặc biệt dùng cho bộ lọc "Tất cả chi nhánh" */
export const ALL_BRANCHES_FILTER = 'ALL';
