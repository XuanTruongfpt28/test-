import type { Employee } from '../types';

/**
 * Dữ liệu nhân viên mẫu, phân bổ cho 4 chi nhánh để có sẵn dữ liệu
 * demo khi chạy ứng dụng lần đầu. Trong thực tế, danh sách này nên
 * được quản lý bởi module Nhân sự riêng (ngoài phạm vi yêu cầu hiện tại).
 */
export const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 'NV001', name: 'Nguyễn Văn An', branchId: 'CN_CHO_MOI', position: 'Nhân viên bán hàng' },
  { id: 'NV002', name: 'Trần Thị Bích', branchId: 'CN_CHO_MOI', position: 'Kỹ thuật viên' },
  { id: 'NV003', name: 'Lê Văn Cường', branchId: 'CN_LAP_VO', position: 'Nhân viên bán hàng' },
  { id: 'NV004', name: 'Phạm Thị Dung', branchId: 'CN_LAP_VO', position: 'Thu ngân' },
  { id: 'NV005', name: 'Huỳnh Văn Em', branchId: 'CN_MY_LUONG_3', position: 'Kỹ thuật viên' },
  { id: 'NV006', name: 'Võ Thị Phương', branchId: 'CN_MY_LUONG_3', position: 'Nhân viên bán hàng' },
  { id: 'NV007', name: 'Đặng Văn Giàu', branchId: 'CN_MY_LUONG_4', position: 'Quản lý ca' },
  { id: 'NV008', name: 'Bùi Thị Hoa', branchId: 'CN_MY_LUONG_4', position: 'Thu ngân' },
];
