/**
 * ============================================================
 *  timeUtils.ts - Hàm tính toán giờ công (PURE FUNCTIONS)
 * ============================================================
 * Toàn bộ hàm trong file này đều là "pure function": chỉ nhận đầu vào,
 * trả về đầu ra, KHÔNG đọc/ghi state, KHÔNG side-effect (trừ hàm lấy
 * giờ hiện tại). Nhờ vậy có thể unit-test độc lập và tái sử dụng ở
 * bất kỳ đâu (hooks, services...) mà không phụ thuộc React.
 *
 * ⚠️ QUY TẮC BẮT BUỘC: mọi hàm tính Đúng giờ/Đi muộn/Về sớm/Tăng ca
 * đều nhận `ShiftConfig` làm tham số. Không được hardcode bất kỳ mốc
 * giờ nào ở đây - toàn bộ khung giờ ca do người quản trị cấu hình.
 */
import type {
  ShiftConfig,
  CheckInResult,
  CheckOutResult,
} from '../types';

/**
 * Chuyển chuỗi giờ "HH:mm" thành tổng số phút kể từ 00:00.
 * Ví dụ: "08:15" -> 8 * 60 + 15 = 495
 */
export function parseTimeToMinutes(time: string): number {
  const [hourStr, minuteStr] = time.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error(`Định dạng giờ không hợp lệ: "${time}". Yêu cầu định dạng "HH:mm".`);
  }
  return hour * 60 + minute;
}

/** Chuyển tổng số phút thành chuỗi giờ "HH:mm" (dùng khi hiển thị lại). */
export function minutesToTimeString(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440; // đảm bảo không âm, không tràn ngày
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Lấy chuỗi giờ hiện tại theo định dạng "HH:mm" (có side-effect vì đọc đồng hồ hệ thống). */
export function getCurrentTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/** Lấy chuỗi ngày hiện tại theo định dạng "YYYY-MM-DD" (dùng làm khoá dữ liệu theo ngày). */
export function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Định dạng số phút thành chuỗi dễ đọc, ví dụ 95 -> "1 giờ 35 phút". */
export function formatMinutesToReadable(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 phút';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} phút`;
  if (minutes === 0) return `${hours} giờ`;
  return `${hours} giờ ${minutes} phút`;
}

/**
 * Tính trạng thái CHECK-IN dựa trên giờ vào ca thực tế so với cấu hình ca.
 *
 * Nguyên tắc: nếu số phút đến sau giờ bắt đầu ca <= grace period thì vẫn
 * tính "Đúng giờ" (on_time). Vượt quá grace period thì tính "Đi muộn"
 * (late) và trả về đúng số phút trễ thực tế (KHÔNG trừ đi grace period,
 * vì grace period chỉ là ngưỡng miễn phạt chứ không phải phút được trừ).
 *
 * Đến sớm hơn giờ bắt đầu ca luôn được tính "Đúng giờ", 0 phút trễ.
 */
export function calculateCheckInStatus(shift: ShiftConfig, checkInTime: string): CheckInResult {
  const shiftStartMinutes = parseTimeToMinutes(shift.startTime);
  const checkInMinutes = parseTimeToMinutes(checkInTime);
  const diffMinutes = checkInMinutes - shiftStartMinutes;

  if (diffMinutes <= shift.gracePeriodMinutes) {
    return { status: 'on_time', lateMinutes: 0 };
  }

  return { status: 'late', lateMinutes: diffMinutes };
}

/**
 * Tính trạng thái CHECK-OUT dựa trên giờ tan ca thực tế so với cấu hình ca.
 *
 * - Về trước giờ kết thúc ca (vượt ngoài grace period) -> "early_leave"
 *   kèm số phút về sớm.
 * - Về đúng trong khoảng grace period quanh giờ kết thúc -> "on_time".
 * - Về sau giờ kết thúc ca (vượt ngoài grace period) -> "overtime" kèm
 *   số phút tăng ca.
 *
 * Grace period ở đây đóng vai trò "vùng đệm" hai chiều quanh giờ kết
 * thúc ca, tránh việc chỉ trễ/sớm vài phút do bấm nút thủ công đã bị
 * gắn nhãn sai.
 */
export function calculateCheckOutStatus(shift: ShiftConfig, checkOutTime: string): CheckOutResult {
  const shiftEndMinutes = parseTimeToMinutes(shift.endTime);
  const checkOutMinutes = parseTimeToMinutes(checkOutTime);
  const diffMinutes = checkOutMinutes - shiftEndMinutes; // âm = về sớm, dương = về trễ (tăng ca)

  if (diffMinutes < -shift.gracePeriodMinutes) {
    return { status: 'early_leave', earlyLeaveMinutes: Math.abs(diffMinutes), overtimeMinutes: 0 };
  }

  if (diffMinutes > shift.gracePeriodMinutes) {
    return { status: 'overtime', earlyLeaveMinutes: 0, overtimeMinutes: diffMinutes };
  }

  return { status: 'on_time', earlyLeaveMinutes: 0, overtimeMinutes: 0 };
}

/**
 * Gợi ý ca làm việc gần nhất với thời điểm hiện tại, dựa trên khoảng
 * cách từ "giờ hiện tại" đến "giờ bắt đầu ca". Dùng để tự động chọn
 * sẵn ca phù hợp trên màn hình Kiosk, giúp nhân viên đỡ phải chọn tay.
 *
 * Quy tắc chọn: ưu tiên ca đang trong khung giờ hoạt động (giờ hiện tại
 * nằm giữa startTime và endTime); nếu không có ca nào đang hoạt động,
 * chọn ca có giờ bắt đầu gần nhất với hiện tại.
 */
export function suggestNearestShift(
  shifts: ShiftConfig[],
  currentTime: string = getCurrentTimeString(),
): ShiftConfig | null {
  if (shifts.length === 0) return null;

  const nowMinutes = parseTimeToMinutes(currentTime);

  const activeShift = shifts.find((shift) => {
    const start = parseTimeToMinutes(shift.startTime);
    const end = parseTimeToMinutes(shift.endTime);
    return nowMinutes >= start && nowMinutes <= end;
  });
  if (activeShift) return activeShift;

  let closestShift = shifts[0];
  let smallestDiff = Math.abs(nowMinutes - parseTimeToMinutes(shifts[0].startTime));

  for (const shift of shifts) {
    const diff = Math.abs(nowMinutes - parseTimeToMinutes(shift.startTime));
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestShift = shift;
    }
  }

  return closestShift;
}

/**
 * Tính số giờ làm việc thực tế (dạng số thập phân, ví dụ 8.5 = 8 giờ 30 phút)
 * dựa trên giờ check-in và check-out. Nếu chưa check-out thì trả về 0.
 */
export function calculateWorkedHours(checkInTime?: string, checkOutTime?: string): number {
  if (!checkInTime || !checkOutTime) return 0;
  const start = parseTimeToMinutes(checkInTime);
  const end = parseTimeToMinutes(checkOutTime);
  const diffMinutes = end - start;
  if (diffMinutes <= 0) return 0;
  return Math.round((diffMinutes / 60) * 100) / 100; // làm tròn 2 chữ số thập phân
}
