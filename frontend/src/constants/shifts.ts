import type { ShiftConfig } from '../types';

/**
 * Ca làm việc KHỞI TẠO khi hệ thống chạy lần đầu (chưa có dữ liệu trong
 * LocalStorage). Đây chỉ là giá trị mặc định - người quản trị có toàn
 * quyền thêm/sửa/xoá thông qua màn hình "Cấu hình ca làm việc".
 *
 * ⚠️ Lưu ý: các giá trị giờ giấc dưới đây KHÔNG được import trực tiếp
 * vào logic tính toán (timeUtils.ts). Logic luôn nhận ShiftConfig làm
 * tham số để đảm bảo hoạt động đúng với ca do người dùng tự định nghĩa.
 */
export const DEFAULT_SHIFTS: ShiftConfig[] = [
  {
    id: 'shift_sang',
    name: 'Ca Sáng',
    startTime: '07:30',
    endTime: '11:30',
    gracePeriodMinutes: 5,
  },
  {
    id: 'shift_chieu',
    name: 'Ca Chiều',
    startTime: '13:00',
    endTime: '17:30',
    gracePeriodMinutes: 5,
  },
  {
    id: 'shift_hanh_chinh',
    name: 'Ca Hành Chính',
    startTime: '08:00',
    endTime: '17:00',
    gracePeriodMinutes: 10,
  },
];
