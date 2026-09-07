/**
 * ============================================================
 *  TYPES - Định nghĩa toàn bộ kiểu dữ liệu dùng chung hệ thống
 * ============================================================
 * Toàn bộ interface nghiệp vụ (Branch, Employee, Shift, AttendanceRecord)
 * được khai báo tập trung tại đây để các layer khác (services, hooks,
 * components) import dùng chung, tránh lặp lại định nghĩa.
 */

/** Một chi nhánh trong chuỗi cửa hàng */
export interface Branch {
  /** Mã định danh duy nhất, ví dụ: CN_CHO_MOI */
  id: string;
  /** Tên hiển thị, ví dụ: Cửa hàng Chợ Mới */
  name: string;
  /** Địa chỉ (tuỳ chọn, phục vụ hiển thị chi tiết) */
  address?: string;
}

/** Một nhân viên thuộc một chi nhánh cụ thể */
export interface Employee {
  /** Mã nhân viên, ví dụ: NV001 */
  id: string;
  /** Họ tên nhân viên */
  name: string;
  /** Chi nhánh đang làm việc (tham chiếu tới Branch.id) */
  branchId: string;
  /** Chức danh (tuỳ chọn) */
  position?: string;
}

/**
 * Cấu hình một ca làm việc do người quản trị tự định nghĩa.
 * KHÔNG được hardcode giờ giấc trong logic - mọi tính toán trễ/sớm/
 * tăng ca đều phải tra cứu động qua object này.
 */
export interface ShiftConfig {
  /** Mã ca, sinh tự động dạng shift_<timestamp> */
  id: string;
  /** Tên ca, ví dụ: Ca Sáng, Ca Chiều, Ca Hành Chính */
  name: string;
  /** Giờ bắt đầu ca, định dạng "HH:mm" (24h), ví dụ "08:00" */
  startTime: string;
  /** Giờ kết thúc ca, định dạng "HH:mm" (24h), ví dụ "17:00" */
  endTime: string;
  /** Số phút cho phép trễ mà vẫn tính Đúng giờ */
  gracePeriodMinutes: number;
}

/** Trạng thái điểm danh khi Check-in */
export type CheckInStatus = 'on_time' | 'late';

/** Trạng thái điểm danh khi Check-out */
export type CheckOutStatus = 'on_time' | 'early_leave' | 'overtime';

/** Trạng thái tổng quan của một dòng chấm công, dùng để hiển thị & lọc */
export type AttendanceOverallStatus =
  | 'in_progress' // đã check-in, chưa check-out
  | 'completed' // đã check-in và check-out
  | 'late' // check-in trễ
  | 'early_leave' // check-out sớm
  | 'absent'; // không có dữ liệu điểm danh trong ngày

/**
 * Một bản ghi chấm công của một nhân viên, trong một ca, một ngày.
 * Đây là đơn vị dữ liệu trung tâm của toàn hệ thống.
 */
export interface AttendanceRecord {
  /** Mã bản ghi duy nhất */
  id: string;
  /** Mã nhân viên (tham chiếu Employee.id) */
  employeeId: string;
  /** Lưu kèm tên nhân viên tại thời điểm chấm công để hiển thị nhanh */
  employeeName: string;
  /** Chi nhánh thực hiện chấm công */
  branchId: string;
  /** Ca làm việc áp dụng cho bản ghi này */
  shiftId: string;
  /** Ngày làm việc, định dạng "YYYY-MM-DD" */
  date: string;
  /** Thời điểm check-in, định dạng "HH:mm", rỗng nếu chưa check-in */
  checkInTime?: string;
  /** Thời điểm check-out, định dạng "HH:mm", rỗng nếu chưa check-out */
  checkOutTime?: string;
  /** Trạng thái tính được khi check-in */
  checkInStatus?: CheckInStatus;
  /** Số phút đi muộn (0 nếu đúng giờ) */
  lateMinutes?: number;
  /** Trạng thái tính được khi check-out */
  checkOutStatus?: CheckOutStatus;
  /** Số phút về sớm (0 nếu không về sớm) */
  earlyLeaveMinutes?: number;
  /** Số phút tăng ca (0 nếu không tăng ca) */
  overtimeMinutes?: number;
  /** Ghi chú lý do (đi trễ có phép, nghỉ ốm,...) */
  note?: string;
  /** Ảnh chụp khuôn mặt / tác phong lúc check-in (Base64 JPEG) */
  checkInPhoto?: string;
}

/** Kết quả tính toán khi thực hiện Check-in, tách biệt để test độc lập */
export interface CheckInResult {
  status: CheckInStatus;
  lateMinutes: number;
}

/** Kết quả tính toán khi thực hiện Check-out, tách biệt để test độc lập */
export interface CheckOutResult {
  status: CheckOutStatus;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
}

/** Thống kê nhanh hiển thị trên Admin Board */
export interface AttendanceStats {
  totalEmployees: number;
  present: number;
  late: number;
  absent: number;
}

/** Thống kê tổng hợp theo tháng cho một nhân viên (phục vụ xuất báo cáo) */
export interface MonthlyEmployeeReport {
  employeeId: string;
  employeeName: string;
  branchId: string;
  totalWorkedHours: number;
  totalLateCount: number;
  totalLateMinutes: number;
  totalEarlyLeaveCount: number;
  totalOvertimeMinutes: number;
  totalAbsentDays: number;
}

/** Vai trò người dùng trong hệ thống */
export type UserRole = 'admin' | 'employee';

/**
 * Thông tin tài khoản người dùng (Admin hoặc Nhân viên / tài khoản con)
 */
export interface UserAccount {
  /** Mã tài khoản duy nhất (vd: usr_admin, usr_NV001) */
  id: string;
  /** Tên đăng nhập (duy nhất, viết thường không dấu) */
  username: string;
  /** Mật khẩu đăng nhập */
  password: string;
  /** Vai trò: Quản trị viên (admin) hoặc Nhân viên (employee) */
  role: UserRole;
  /** Mã nhân viên tương ứng (chỉ áp dụng khi role = employee) */
  employeeId?: string;
  /** Họ tên đầy đủ */
  name: string;
  /** Chi nhánh công tác */
  branchId?: string;
  /** Chức danh / Vị trí */
  position?: string;
  /** Số điện thoại (tuỳ chọn) */
  phone?: string;
  /** Trạng thái kích hoạt: true = đang hoạt động, false = bị Admin khoá */
  isActive: boolean;
  /** Thời điểm tạo tài khoản (ISO String) */
  createdAt: string;
  /** Thời điểm đăng nhập gần nhất */
  lastLoginAt?: string;
}

