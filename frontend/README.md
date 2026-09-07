# Hệ thống Quản lý Điểm danh Nhân viên — Xe Điện Thanh Tươi

React + TypeScript + Vite + Tailwind CSS. Quản lý điểm danh cho 4 chi nhánh,
với cấu hình ca làm việc hoàn toàn linh hoạt (không hardcode giờ giấc).

## Chạy dự án

```bash
npm install
npm run dev       # môi trường phát triển
npm run build     # build production ra thư mục dist/
```

## Cây thư mục

```
src/
├── types/
│   └── index.ts              # Toàn bộ interface: Branch, Employee, ShiftConfig, AttendanceRecord...
│
├── constants/
│   ├── branches.ts            # 4 chi nhánh mặc định
│   ├── shifts.ts               # Ca làm việc khởi tạo (chỉ là seed, người dùng tự sửa được)
│   └── employees.ts            # Nhân viên mẫu cho 4 chi nhánh
│
├── services/
│   ├── storage/
│   │   └── StorageAdapter.ts   # Repository/Adapter Pattern: IStorageAdapter<T> + LocalStorageAdapter
│   │                            # -> Sau này chỉ cần viết RestApiAdapter/SupabaseAdapter cùng interface
│   ├── attendanceStorage.ts    # Logic lưu trữ + nghiệp vụ check-in/check-out
│   ├── shiftService.ts         # CRUD cấu hình ca làm việc
│   ├── employeeService.ts      # Truy vấn danh sách nhân viên theo chi nhánh
│   └── reportService.ts        # Tổng hợp báo cáo tháng + xuất CSV
│
├── utils/
│   └── timeUtils.ts             # Toàn bộ hàm tính giờ công (pure functions, có comment tiếng Việt)
│
├── hooks/
│   ├── useShifts.ts              # State + hành động CRUD ca làm việc
│   └── useAttendance.ts          # State trung tâm: lọc chi nhánh/ngày, check-in/out, thống kê
│
├── components/
│   ├── Header.tsx                # Thương hiệu + chuyển tab Kiosk/Quản lý
│   ├── BranchDateFilter.tsx      # Bộ lọc chi nhánh (pill) + chọn ngày
│   ├── StatsCard.tsx             # 4 thẻ thống kê nhanh
│   ├── CheckInForm.tsx           # Giao diện Kiosk check-in/check-out
│   ├── AttendanceTable.tsx       # Bảng chấm công: tìm kiếm, lọc trạng thái, ghi chú
│   ├── ShiftConfigModal.tsx      # Modal thêm/sửa/xoá ca làm việc
│   ├── ExportPanel.tsx           # Nút mở cấu hình ca + xuất CSV
│   └── StatusBadge.tsx           # Nhãn trạng thái dùng chung
│
├── App.tsx                        # Lắp ráp layout, không chứa logic nghiệp vụ
├── main.tsx                        # Entry point
└── index.css                       # Tailwind v4 + design tokens (màu, font)
```

## Nguyên tắc kiến trúc

1. **Không hardcode giờ ca**: mọi hàm trong `utils/timeUtils.ts` đều nhận
   `ShiftConfig` làm tham số. Đổi giờ ca trong modal "Cấu hình ca làm việc"
   sẽ ảnh hưởng ngay lập tức đến toàn bộ phép tính trễ/sớm/tăng ca.
2. **Tách biệt tầng dữ liệu**: component không bao giờ gọi thẳng
   `localStorage`. Mọi thao tác đọc/ghi đi qua `IStorageAdapter<T>`
   (`src/services/storage/StorageAdapter.ts`). Muốn chuyển sang REST API
   hoặc Supabase, chỉ cần viết một class mới implement cùng interface,
   rồi thay chỗ khởi tạo `new LocalStorageAdapter(...)` trong các file
   `*Service.ts` — không phải sửa hook hay component nào khác.
3. **Logic nghiệp vụ nằm ngoài component**: `services/` và `utils/` chứa
   toàn bộ tính toán; `hooks/` kết nối chúng với React state;
   `components/` chỉ hiển thị.

## Mở rộng thêm

- Thêm chi nhánh mới: sửa `src/constants/branches.ts`.
- Thêm nhân viên: sửa `src/constants/employees.ts` hoặc nối `employeeService.ts`
  vào API thật.
- Đổi bảng màu/font: sửa `@theme` trong `src/index.css`.
