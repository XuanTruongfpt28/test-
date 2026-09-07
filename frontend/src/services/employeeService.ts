/**
 * employeeService.ts
 * ------------------
 * Nghiệp vụ truy vấn danh sách nhân viên. Hiện tại dữ liệu là seed cố
 * định + LocalStorage, nhưng interface trả về Promise sẵn để tương
 * thích khi thay bằng gọi API thật (không cần sửa nơi gọi).
 */
import type { Employee } from '../types';
import { STORAGE_KEYS, type IStorageAdapter } from './storage/StorageAdapter';
import { createAdapter } from './storage/adapterFactory';
import { DEFAULT_EMPLOYEES } from '../constants/employees';

const adapter: IStorageAdapter<Employee> = createAdapter<Employee>(STORAGE_KEYS.EMPLOYEES, 'employees');

/** Lấy toàn bộ nhân viên. Nếu chưa có dữ liệu, khởi tạo bằng DEFAULT_EMPLOYEES. */
export async function getEmployees(): Promise<Employee[]> {
  const employees = await adapter.getAll();
  if (employees.length === 0) {
    await adapter.saveAll(DEFAULT_EMPLOYEES);
    return DEFAULT_EMPLOYEES;
  }
  return employees;
}

/** Lấy danh sách nhân viên thuộc một chi nhánh cụ thể. */
export async function getEmployeesByBranch(branchId: string): Promise<Employee[]> {
  const employees = await getEmployees();
  return employees.filter((employee) => employee.branchId === branchId);
}

/** Tìm một nhân viên theo mã số. */
export async function findEmployeeById(employeeId: string): Promise<Employee | undefined> {
  const employees = await getEmployees();
  return employees.find((employee) => employee.id === employeeId);
}

/** Thêm hoặc cập nhật một nhân viên vào danh sách. */
export async function upsertEmployee(employee: Employee): Promise<void> {
  const employees = await getEmployees();
  const index = employees.findIndex((e) => e.id === employee.id);
  let updated: Employee[];
  if (index >= 0) {
    updated = employees.map((e) => (e.id === employee.id ? { ...e, ...employee } : e));
  } else {
    updated = [...employees, employee];
  }
  await adapter.saveAll(updated);
}

/** Xoá một nhân viên khỏi danh sách. */
export async function removeEmployee(employeeId: string): Promise<void> {
  const employees = await getEmployees();
  const filtered = employees.filter((e) => e.id !== employeeId);
  await adapter.saveAll(filtered);
}

