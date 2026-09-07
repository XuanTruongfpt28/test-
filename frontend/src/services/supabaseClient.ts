/**
 * supabaseClient.ts
 * ------------------
 * Khởi tạo Supabase client dùng chung cho toàn app.
 * Cần khai báo VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong file
 * `.env` (xem `.env.example`).
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    '[supabaseClient] Thiếu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
      'Nếu VITE_STORAGE_MODE=supabase, app sẽ lỗi khi gọi API. Xem .env.example.',
  );
}

export const supabase = createClient(url ?? '', anonKey ?? '');
