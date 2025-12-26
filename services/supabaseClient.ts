
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

// Kiểm tra xem người dùng đã nhập key chưa để cảnh báo lỗi rõ ràng hơn
if (SUPABASE_URL.includes('your-project-id') || SUPABASE_ANON_KEY.includes('your-anon-key')) {
  console.warn("⚠️ CẢNH BÁO: Bạn chưa nhập Supabase URL và Key trong file 'config.ts'. Chức năng đăng nhập sẽ không hoạt động.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
