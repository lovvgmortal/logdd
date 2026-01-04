
-- Thêm cột email vào user_settings
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS email text;

-- Cập nhật email cho các user_settings hiện tại
UPDATE public.user_settings us
SET email = (SELECT email FROM auth.users au WHERE au.id = us.user_id);

-- Cập nhật trigger để lưu email khi tạo user_settings mới
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Tạo profile cho user mới
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  
  -- Tạo user_settings cho user mới với email
  INSERT INTO public.user_settings (user_id, email)
  VALUES (new.id, new.email);
  
  RETURN new;
END;
$$;
