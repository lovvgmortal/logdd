
// ==============================================================================
// CẤU HÌNH HỆ THỐNG (NHẬP KEY CỦA BẠN TẠI ĐÂY)
// ==============================================================================

// 1. SUPABASE CONFIG (Bắt buộc để đăng nhập)
// Lấy tại: Supabase Dashboard -> Project Settings -> API
export const SUPABASE_URL = "https://ajwyrudhvbxzcpinajci.supabase.co";
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqd3lydWRodmJ4emNwaW5hamNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MzExMjksImV4cCI6MjA4MjMwNzEyOX0.ME5TbTUhgPT8idyPZyW-OVmUskahbqb1w0bDm3oGMF0';

// 2. YOUTUBE API (Để lấy comment viral)
// Lấy tại: Google Cloud Console -> Enable YouTube Data API v3 -> Credentials
// Key này sẽ được lấy từ database (bảng user_settings) nếu bạn đã setup, hoặc fallback về đây
export const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

// 3. OPENROUTER API (Để chạy AI viết kịch bản)
// Lấy tại: https://openrouter.ai/keys
// Key này sẽ được lấy từ database (bảng user_settings) nếu bạn đã setup, hoặc fallback về đây
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// ==============================================================================
// LƯU Ý:
// - Bạn đã chọn quản lý API Key trong Database (bảng user_settings).
// - Hãy đảm bảo bạn đã chạy SQL và nhập key vào bảng đó trong Supabase.
// ==============================================================================
