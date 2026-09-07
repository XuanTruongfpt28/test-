# Backend — Supabase

Backend của dự án là một **project Supabase** (Postgres + Auto REST API qua
PostgREST + Realtime + Auth). Thư mục này chỉ chứa **schema + cấu hình**,
không có server code tự viết — đúng tinh thần "backend tối thiểu" của Supabase.

## Cấu trúc

```
backend/
└── supabase/
    ├── migrations/
    │   └── 0001_init_schema.sql   # 5 bảng: branches, employees,
    │                               # shift_configs, user_accounts,
    │                               # attendance_records + RLS policies
    └── seed.sql                    # Dữ liệu mẫu (chi nhánh, ca, admin)
```

## Cài đặt lần đầu

1. Tạo project mới tại https://supabase.com/dashboard
2. Cài Supabase CLI (nếu muốn quản lý migration bằng CLI):
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref <project-ref-của-bạn>
   ```
3. Chạy migration:
   ```bash
   supabase db push
   ```
   Hoặc đơn giản hơn: mở **SQL Editor** trên Supabase Dashboard, dán nội dung
   `migrations/0001_init_schema.sql` rồi bấm Run. Sau đó làm tương tự với
   `seed.sql`.
4. Lấy 2 giá trị từ **Project Settings → API**:
   - `Project URL`
   - `anon public key`

   Điền vào `frontend/.env` (xem `frontend/.env.example`).

## Mô hình bảo mật hiện tại (MVP)

Bảng dùng RLS policy `using (true)` — nghĩa là bất kỳ ai cầm `anon key`
(vốn là key public, nằm trong code frontend) đều đọc/ghi được toàn bộ dữ
liệu. Đây **không phải lỗ hổng mới** — nó tương đương chính xác mức bảo mật
hiện tại của bản localStorage (dữ liệu + mật khẩu nằm ngay trên máy client,
phân quyền admin/employee chỉ kiểm tra ở phía UI). Đổi sang Supabase với
cấu hình này giúp bạn có dữ liệu **dùng chung nhiều máy/nhiều chi nhánh**
mà không làm giảm bảo mật so với hiện tại.

### Nâng cấp bảo mật (khi cần, không bắt buộc ngay)

Khi sẵn sàng siết chặt, làm theo 2 bước:

1. **Chuyển sang Supabase Auth** thay vì tự quản `user_accounts.password`:
   - Đăng ký user bằng email giả dạng `username@thanhtuoi.local`.
   - Bảng `user_accounts` chỉ giữ `role`, `employee_id`, `branch_id`... và
     thêm cột `auth_user_id uuid references auth.users(id)`.
   - Xoá cột `password` (Supabase Auth tự hash và lưu mật khẩu an toàn).
2. **Viết lại RLS policy dựa trên `auth.uid()` + `role`**, ví dụ:
   ```sql
   create policy "employee chỉ đọc bản ghi của chính mình"
     on attendance_records for select
     using (
       employee_id = (
         select employee_id from user_accounts where auth_user_id = auth.uid()
       )
       or exists (
         select 1 from user_accounts
         where auth_user_id = auth.uid() and role = 'admin'
       )
     );
   ```

Không cần làm bước này trước khi launch — chỉ nên làm trước khi dữ liệu
chấm công có tính nhạy cảm cao hoặc ứng dụng mở rộng ra internet công khai.

## Vì sao không cần Edge Functions?

Toàn bộ nghiệp vụ tính "đi trễ/về sớm/tăng ca" (`timeUtils.ts`) là hàm
thuần (pure function, không I/O) nên **tiếp tục chạy ở frontend** — không
cần chuyển thành Edge Function. Backend chỉ đóng vai trò lưu trữ + đồng bộ
dữ liệu.
