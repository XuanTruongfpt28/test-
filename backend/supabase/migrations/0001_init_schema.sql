-- ============================================================
--  0001_init_schema.sql
--  Schema khởi tạo cho Hệ thống Điểm danh — Xe Điện Thanh Tươi
--  Ánh xạ 1-1 từ frontend/src/types/index.ts
-- ============================================================

-- --------------------------------------------------------------
-- 1. branches — Chi nhánh
-- --------------------------------------------------------------
create table if not exists branches (
  id         text primary key,
  name       text not null,
  address    text
);

-- --------------------------------------------------------------
-- 2. employees — Nhân viên
-- --------------------------------------------------------------
create table if not exists employees (
  id         text primary key,
  name       text not null,
  branch_id  text not null references branches(id) on delete restrict,
  position   text
);

-- --------------------------------------------------------------
-- 3. shift_configs — Cấu hình ca làm việc
-- --------------------------------------------------------------
create table if not exists shift_configs (
  id                    text primary key,
  name                  text not null,
  start_time            text not null,  -- "HH:mm"
  end_time              text not null,  -- "HH:mm"
  grace_period_minutes  integer not null default 0
);

-- --------------------------------------------------------------
-- 4. user_accounts — Tài khoản đăng nhập (admin / employee)
-- --------------------------------------------------------------
create table if not exists user_accounts (
  id           text primary key,
  username     text not null unique,
  password     text not null,          -- xem ghi chú bảo mật trong backend/README.md
  role         text not null check (role in ('admin', 'employee')),
  employee_id  text references employees(id) on delete set null,
  name         text not null,
  branch_id    text references branches(id) on delete set null,
  position     text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- --------------------------------------------------------------
-- 5. attendance_records — Bản ghi chấm công (bảng lớn nhất, sẽ tăng dần)
-- --------------------------------------------------------------
create table if not exists attendance_records (
  id                    text primary key,
  employee_id           text not null references employees(id) on delete cascade,
  employee_name         text not null,
  branch_id             text not null references branches(id) on delete restrict,
  shift_id              text not null references shift_configs(id) on delete restrict,
  date                  date not null,
  check_in_time         text,           -- "HH:mm"
  check_out_time        text,           -- "HH:mm"
  check_in_status       text check (check_in_status in ('on_time','late')),
  late_minutes          integer,
  check_out_status      text check (check_out_status in ('on_time','early_leave','overtime')),
  early_leave_minutes   integer,
  overtime_minutes      integer,
  note                  text,
  check_in_photo        text            -- Base64 JPEG (khuyến nghị: chuyển sang Supabase Storage sau này)
);

create index if not exists idx_attendance_date_branch
  on attendance_records (date, branch_id);
create index if not exists idx_attendance_employee
  on attendance_records (employee_id);

-- ================================================================
--  Row Level Security
--  MVP: mở quyền đọc/ghi cho mọi client dùng anon key, TƯƠNG ĐƯƠNG
--  mức bảo mật hiện tại (app quản lý quyền admin/employee ở phía
--  client, mật khẩu lưu dạng plaintext trong localStorage).
--  ⚠️ Trước khi lên production thật, nên chuyển sang Supabase Auth
--  + policies theo auth.uid() (xem mục "Nâng cấp bảo mật" trong
--  backend/README.md).
-- ================================================================
alter table branches            enable row level security;
alter table employees           enable row level security;
alter table shift_configs       enable row level security;
alter table user_accounts       enable row level security;
alter table attendance_records  enable row level security;

create policy "anon full access - branches"           on branches           for all using (true) with check (true);
create policy "anon full access - employees"          on employees          for all using (true) with check (true);
create policy "anon full access - shift_configs"      on shift_configs      for all using (true) with check (true);
create policy "anon full access - user_accounts"      on user_accounts      for all using (true) with check (true);
create policy "anon full access - attendance_records" on attendance_records for all using (true) with check (true);
