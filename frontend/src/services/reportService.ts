/**
 * reportService.ts
 * ----------------
 * Tổng hợp dữ liệu chấm công thành báo cáo theo tháng cho từng nhân
 * viên, và xuất ra file CSV (mở được trực tiếp bằng Excel).
 */
import type { AttendanceRecord, Employee, MonthlyEmployeeReport } from '../types';
import { calculateWorkedHours } from '../utils/timeUtils';
import { getAllAttendanceRecords } from './attendanceStorage';

/** Đếm số ngày làm việc thực tế trong tháng (dùng để tính số ngày vắng gần đúng). */
function countBusinessDaysInMonth(year: number, month: number, upToDay: number): number {
  let count = 0;
  for (let day = 1; day <= upToDay; day += 1) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0 = Chủ nhật
    if (dayOfWeek !== 0) count += 1; // giả định làm việc từ Thứ 2 - Thứ 7
  }
  return count;
}

/**
 * Tổng hợp báo cáo tháng cho danh sách nhân viên, dựa trên toàn bộ
 * bản ghi chấm công có "date" thuộc tháng/năm chỉ định.
 */
export async function buildMonthlyReport(
  employees: Employee[],
  year: number,
  month: number, // 1-12
): Promise<MonthlyEmployeeReport[]> {
  const allRecords = await getAllAttendanceRecords();
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const recordsInMonth = allRecords.filter((r) => r.date.startsWith(monthPrefix));

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const upToDay = isCurrentMonth ? today.getDate() : new Date(year, month, 0).getDate();
  const businessDaysSoFar = countBusinessDaysInMonth(year, month, upToDay);

  return employees.map((employee) => {
    const employeeRecords: AttendanceRecord[] = recordsInMonth.filter(
      (r) => r.employeeId === employee.id,
    );

    const totalWorkedHours = employeeRecords.reduce(
      (sum, r) => sum + calculateWorkedHours(r.checkInTime, r.checkOutTime),
      0,
    );
    const totalLateCount = employeeRecords.filter((r) => r.checkInStatus === 'late').length;
    const totalLateMinutes = employeeRecords.reduce((sum, r) => sum + (r.lateMinutes ?? 0), 0);
    const totalEarlyLeaveCount = employeeRecords.filter(
      (r) => r.checkOutStatus === 'early_leave',
    ).length;
    const totalOvertimeMinutes = employeeRecords.reduce(
      (sum, r) => sum + (r.overtimeMinutes ?? 0),
      0,
    );
    const daysWithRecord = new Set(employeeRecords.map((r) => r.date)).size;
    const totalAbsentDays = Math.max(businessDaysSoFar - daysWithRecord, 0);

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      branchId: employee.branchId,
      totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
      totalLateCount,
      totalLateMinutes,
      totalEarlyLeaveCount,
      totalOvertimeMinutes,
      totalAbsentDays,
    };
  });
}

/** Chuyển một mảng object đồng nhất thành nội dung CSV (UTF-8 BOM để Excel hiển thị đúng tiếng Việt). */
function toCsvContent(headers: string[], rows: (string | number)[][]): string {
  const escapeCell = (cell: string | number): string => {
    const text = String(cell);
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };
  const lines = [headers.map(escapeCell).join(',')];
  rows.forEach((row) => lines.push(row.map(escapeCell).join(',')));
  return '\uFEFF' + lines.join('\n'); // \uFEFF = BOM giúp Excel nhận đúng UTF-8
}

/** Kích hoạt tải file CSV báo cáo tổng hợp tháng xuống máy người dùng. */
export function exportMonthlyReportToCsv(report: MonthlyEmployeeReport[], year: number, month: number): void {
  const headers = [
    'Mã NV',
    'Họ tên',
    'Chi nhánh',
    'Tổng giờ làm',
    'Số lần trễ',
    'Tổng phút trễ',
    'Số lần về sớm',
    'Tổng phút tăng ca',
    'Số ngày vắng (ước tính)',
  ];
  const rows = report.map((r) => [
    r.employeeId,
    r.employeeName,
    r.branchId,
    r.totalWorkedHours,
    r.totalLateCount,
    r.totalLateMinutes,
    r.totalEarlyLeaveCount,
    r.totalOvertimeMinutes,
    r.totalAbsentDays,
  ]);

  const csvContent = toCsvContent(headers, rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bao_cao_cham_cong_${year}_${String(month).padStart(2, '0')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Xuất nhanh bảng chấm công của một ngày/chi nhánh cụ thể ra CSV (dùng ngay trên Admin Board). */
export function exportDailyAttendanceToCsv(records: AttendanceRecord[], date: string): void {
  const headers = [
    'Mã NV',
    'Họ tên',
    'Chi nhánh',
    'Giờ vào',
    'Trạng thái vào',
    'Phút trễ',
    'Giờ ra',
    'Trạng thái ra',
    'Phút về sớm',
    'Phút tăng ca',
    'Ghi chú',
  ];
  const rows = records.map((r) => [
    r.employeeId,
    r.employeeName,
    r.branchId,
    r.checkInTime ?? '',
    r.checkInStatus ?? '',
    r.lateMinutes ?? 0,
    r.checkOutTime ?? '',
    r.checkOutStatus ?? '',
    r.earlyLeaveMinutes ?? 0,
    r.overtimeMinutes ?? 0,
    r.note ?? '',
  ]);

  const csvContent = toCsvContent(headers, rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `diem_danh_${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
