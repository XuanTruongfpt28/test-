/**
 * ============================================================
 *  attendanceStorage.ts - Logic lưu trữ & nghiệp vụ chấm công
 * ============================================================
 * File này chịu trách nhiệm duy nhất: đọc/ghi AttendanceRecord và áp
 * dụng nghiệp vụ check-in/check-out. Component KHÔNG được tự tính
 * toán trạng thái điểm danh - mọi thứ đi qua các hàm ở đây.
 */
import type { AttendanceRecord, ShiftConfig } from '../types';
import { STORAGE_KEYS, type IStorageAdapter } from './storage/StorageAdapter';
import { createAdapter } from './storage/adapterFactory';
import {
  calculateCheckInStatus,
  calculateCheckOutStatus,
  getCurrentDateString,
  getCurrentTimeString,
} from '../utils/timeUtils';

const adapter: IStorageAdapter<AttendanceRecord> = createAdapter<AttendanceRecord>(
  STORAGE_KEYS.ATTENDANCE_RECORDS,
  'attendance_records',
);

/** Lấy toàn bộ bản ghi chấm công (không lọc). */
export async function getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
  return adapter.getAll();
}

/** Lấy danh sách bản ghi chấm công theo ngày, và (tuỳ chọn) theo chi nhánh. */
export async function getAttendanceRecords(params: {
  date: string;
  branchId?: string;
}): Promise<AttendanceRecord[]> {
  const all = await adapter.getAll();
  return all.filter((record) => {
    const matchDate = record.date === params.date;
    const matchBranch = !params.branchId || params.branchId === 'ALL' || record.branchId === params.branchId;
    return matchDate && matchBranch;
  });
}

/**
 * Tìm bản ghi chấm công hiện tại (chưa check-out) của một nhân viên
 * trong ngày, dùng để xác định nhân viên đang bấm Check-in hay Check-out.
 */
export async function findOpenRecordForEmployee(
  employeeId: string,
  date: string,
): Promise<AttendanceRecord | undefined> {
  const all = await adapter.getAll();
  return all.find(
    (record) => record.employeeId === employeeId && record.date === date && !record.checkOutTime,
  );
}

/**
 * Thực hiện CHECK-IN cho một nhân viên: tạo bản ghi mới, tính trạng thái
 * (Đúng giờ / Đi muộn kèm số phút) dựa trên ca được chọn, rồi lưu lại.
 */
export async function checkIn(params: {
  employeeId: string;
  employeeName: string;
  branchId: string;
  shift: ShiftConfig;
  checkInPhoto?: string;
}): Promise<AttendanceRecord> {
  const date = getCurrentDateString();
  const checkInTime = getCurrentTimeString();
  const { status, lateMinutes } = calculateCheckInStatus(params.shift, checkInTime);

  const newRecord: AttendanceRecord = {
    id: `att_${Date.now()}`,
    employeeId: params.employeeId,
    employeeName: params.employeeName,
    branchId: params.branchId,
    shiftId: params.shift.id,
    date,
    checkInTime,
    checkInStatus: status,
    lateMinutes,
    checkInPhoto: params.checkInPhoto,
  };

  const all = await adapter.getAll();
  await adapter.saveAll([...all, newRecord]);
  return newRecord;
}

/**
 * Thực hiện CHECK-OUT cho một bản ghi đã tồn tại: tính trạng thái
 * (Đúng giờ / Về sớm / Tăng ca) dựa trên ca đã áp dụng lúc check-in.
 */
export async function checkOut(params: {
  recordId: string;
  shift: ShiftConfig;
}): Promise<AttendanceRecord> {
  const checkOutTime = getCurrentTimeString();
  const { status, earlyLeaveMinutes, overtimeMinutes } = calculateCheckOutStatus(
    params.shift,
    checkOutTime,
  );

  const all = await adapter.getAll();
  let updatedRecord: AttendanceRecord | undefined;

  const updatedList = all.map((record) => {
    if (record.id !== params.recordId) return record;
    updatedRecord = {
      ...record,
      checkOutTime,
      checkOutStatus: status,
      earlyLeaveMinutes,
      overtimeMinutes,
    };
    return updatedRecord;
  });

  if (!updatedRecord) {
    throw new Error(`Không tìm thấy bản ghi chấm công với id "${params.recordId}" để check-out.`);
  }

  await adapter.saveAll(updatedList);
  return updatedRecord;
}

/** Cập nhật ghi chú lý do cho một bản ghi chấm công (đi trễ có phép, nghỉ ốm...). */
export async function updateRecordNote(recordId: string, note: string): Promise<void> {
  const all = await adapter.getAll();
  const updated = all.map((record) => (record.id === recordId ? { ...record, note } : record));
  await adapter.saveAll(updated);
}

/** Lấy toàn bộ lịch sử chấm công của một nhân viên (tuỳ chọn lọc theo tháng YYYY-MM). */
export async function getRecordsForEmployee(
  employeeId: string,
  monthPrefix?: string,
): Promise<AttendanceRecord[]> {
  const all = await adapter.getAll();
  return all
    .filter((r) => {
      const matchEmp = r.employeeId === employeeId;
      const matchMonth = !monthPrefix || r.date.startsWith(monthPrefix);
      return matchEmp && matchMonth;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || (b.checkInTime || '').localeCompare(a.checkInTime || ''));
}

/** Lấy bản ghi chấm công của nhân viên trong ngày hôm nay (ưu tiên ca đang mở chưa check-out). */
export async function getTodayRecordForEmployee(
  employeeId: string,
  date: string = getCurrentDateString(),
): Promise<AttendanceRecord | undefined> {
  const all = await adapter.getAll();
  const records = all.filter((r) => r.employeeId === employeeId && r.date === date);
  const openRecord = records.find((r) => !r.checkOutTime);
  if (openRecord) return openRecord;
  return records[records.length - 1];
}

