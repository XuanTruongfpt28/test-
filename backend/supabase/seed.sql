-- ============================================================
--  seed.sql — Dữ liệu mẫu, tương ứng constants/branches.ts,
--  constants/employees.ts và tài khoản admin mặc định trong
--  authService.ts (DEFAULT_ACCOUNTS).
--  Chỉnh sửa cho khớp với dữ liệu thật của bạn trước khi chạy.
-- ============================================================

insert into branches (id, name) values
  ('CN_CHO_MOI', 'Cửa hàng Chợ Mới'),
  ('CN_2', 'Chi nhánh 2'),
  ('CN_3', 'Chi nhánh 3'),
  ('CN_4', 'Chi nhánh 4')
on conflict (id) do nothing;

insert into shift_configs (id, name, start_time, end_time, grace_period_minutes) values
  ('shift_sang', 'Ca Sáng', '08:00', '17:00', 15)
on conflict (id) do nothing;

insert into user_accounts (id, username, password, role, name, position, is_active) values
  ('usr_admin', 'admin', 'admin123', 'admin', 'Quản trị viên Hệ thống', 'Tổng Quản lý', true)
on conflict (id) do nothing;

-- Thêm employees + user_accounts (role='employee') tương ứng DEFAULT_EMPLOYEES
-- của bạn tại đây theo cùng khuôn mẫu ở trên.
