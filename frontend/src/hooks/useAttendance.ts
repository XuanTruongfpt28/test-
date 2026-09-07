/**
 * useAttendance.ts
 * ----------------
 * Hook trung tâm cho toàn bộ nghiệp vụ điểm danh: nắm giữ bộ lọc
 * (chi nhánh + ngày), danh sách nhân viên, danh sách bản ghi chấm công
 * đã lọc, hành động check-in/check-out, và số liệu thống kê nhanh.
 *
 * Component (CheckInForm, AttendanceTable, StatsCard...) chỉ tiêu thụ
 * dữ liệu/hàm từ hook này, không tự viết logic nghiệp vụ.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AttendanceRecord, AttendanceStats, Employee, ShiftConfig } from '../types';
import { ALL_BRANCHES_FILTER } from '../constants/branches';
import { getEmployees } from '../services/employeeService';
import {
  checkIn as checkInService,
  checkOut as checkOutService,
  findOpenRecordForEmployee,
  getAttendanceRecords,
  updateRecordNote,
} from '../services/attendanceStorage';
import { getCurrentDateString } from '../utils/timeUtils';

export function useAttendance(shifts: ShiftConfig[]) {
  const [branchFilter, setBranchFilter] = useState<string>(ALL_BRANCHES_FILTER);
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentDateString());
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reloadRecords = useCallback(async () => {
    setIsLoading(true);
    const data = await getAttendanceRecords({ date: selectedDate, branchId: branchFilter });
    setRecords(data);
    setIsLoading(false);
  }, [selectedDate, branchFilter]);

  // Nạp danh sách nhân viên một lần khi khởi tạo.
  useEffect(() => {
    getEmployees().then(setEmployees);
  }, []);

  // Nạp lại bản ghi chấm công mỗi khi đổi ngày hoặc chi nhánh.
  useEffect(() => {
    reloadRecords();
  }, [reloadRecords]);

  /** Danh sách nhân viên nằm trong phạm vi chi nhánh đang lọc. */
  const employeesInScope = useMemo(() => {
    if (branchFilter === ALL_BRANCHES_FILTER) return employees;
    return employees.filter((employee) => employee.branchId === branchFilter);
  }, [employees, branchFilter]);

  /** Áp dụng thêm tìm kiếm theo tên/mã NV lên danh sách bản ghi đã lọc theo ngày+chi nhánh. */
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const keyword = searchTerm.trim().toLowerCase();
    return records.filter(
      (record) =>
        record.employeeName.toLowerCase().includes(keyword) ||
        record.employeeId.toLowerCase().includes(keyword),
    );
  }, [records, searchTerm]);

  /** Thống kê nhanh: tổng NV, đang có mặt, đi muộn, vắng mặt (trong phạm vi chi nhánh + ngày). */
  const stats: AttendanceStats = useMemo(() => {
    const totalEmployees = employeesInScope.length;
    const present = records.filter((r) => r.checkInTime && !r.checkOutTime).length;
    const late = records.filter((r) => r.checkInStatus === 'late').length;
    const employeeIdsWithRecord = new Set(records.map((r) => r.employeeId));
    const absent = employeesInScope.filter((e) => !employeeIdsWithRecord.has(e.id)).length;
    return { totalEmployees, present, late, absent };
  }, [employeesInScope, records]);

  /** Thực hiện check-in cho một nhân viên với ca được chọn. */
  const doCheckIn = useCallback(
    async (employee: Employee, shift: ShiftConfig) => {
      await checkInService({
        employeeId: employee.id,
        employeeName: employee.name,
        branchId: employee.branchId,
        shift,
      });
      await reloadRecords();
    },
    [reloadRecords],
  );

  /**
   * Thực hiện check-out cho một nhân viên: tự tìm bản ghi đang mở
   * (đã check-in, chưa check-out) trong ngày hiện tại và ca tương ứng.
   */
  const doCheckOut = useCallback(
    async (employee: Employee) => {
      const openRecord = await findOpenRecordForEmployee(employee.id, getCurrentDateString());
      if (!openRecord) {
        throw new Error(`${employee.name} chưa check-in trong hôm nay, không thể check-out.`);
      }
      const shift = shifts.find((s) => s.id === openRecord.shiftId);
      if (!shift) {
        throw new Error('Không tìm thấy cấu hình ca tương ứng với bản ghi check-in.');
      }
      await checkOutService({ recordId: openRecord.id, shift });
      await reloadRecords();
    },
    [shifts, reloadRecords],
  );

  const setNote = useCallback(
    async (recordId: string, note: string) => {
      await updateRecordNote(recordId, note);
      await reloadRecords();
    },
    [reloadRecords],
  );

  return {
    branchFilter,
    setBranchFilter,
    selectedDate,
    setSelectedDate,
    searchTerm,
    setSearchTerm,
    employees,
    employeesInScope,
    records: filteredRecords,
    rawRecords: records,
    stats,
    isLoading,
    doCheckIn,
    doCheckOut,
    setNote,
    reloadRecords,
  };
}
