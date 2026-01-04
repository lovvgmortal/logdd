-- 1. Bases Tables & RLS (20260101072324)
-- Create tables
CREATE TABLE public.personas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    tone TEXT,
    traits TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.dnas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    niche TEXT,
    tone TEXT,
    pacing TEXT,
    vocabulary TEXT[],
    hook_type TEXT,
    hook_examples TEXT[],
    structure TEXT[],
    patterns TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.blueprints (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    framework TEXT,
    steps JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.scripts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    topic TEXT,
    dna_id UUID REFERENCES public.dnas(id),
    persona_id UUID REFERENCES public.personas(id),
    outline JSONB,
    full_script TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dnas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personas
CREATE POLICY "Users can view their own personas" ON public.personas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own personas" ON public.personas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own personas" ON public.personas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own personas" ON public.personas FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for dnas
CREATE POLICY "Users can view their own dnas" ON public.dnas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own dnas" ON public.dnas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own dnas" ON public.dnas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own dnas" ON public.dnas FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for blueprints
CREATE POLICY "Users can view their own blueprints" ON public.blueprints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own blueprints" ON public.blueprints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own blueprints" ON public.blueprints FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own blueprints" ON public.blueprints FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for scripts
CREATE POLICY "Users can view their own scripts" ON public.scripts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own scripts" ON public.scripts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own scripts" ON public.scripts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own scripts" ON public.scripts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notes
CREATE POLICY "Users can view their own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON public.personas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dnas_updated_at BEFORE UPDATE ON public.dnas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blueprints_updated_at BEFORE UPDATE ON public.blueprints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON public.scripts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. User Settings (20260101074751)
-- Create user_settings table for API keys storage
CREATE TABLE public.user_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    openrouter_api_key TEXT,
    youtube_api_key TEXT,
    preferred_model TEXT DEFAULT 'google/gemini-2.5-flash',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own settings" 
ON public.user_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" 
ON public.user_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.user_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Profiles (20260101081711)
-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile (for trigger)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  RETURN new;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Update Handle New User Trigger (20260101084614)
-- Cập nhật trigger handle_new_user để tạo cả profile và user_settings
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
  
  -- Tạo user_settings cho user mới
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$;

-- 5. Add Email to Settings (20260101085137)
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

-- 6. Folders (20260101120848)
-- Create folders table for organizing scripts
CREATE TABLE public.folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add folder_id to scripts table
ALTER TABLE public.scripts ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- Enable RLS on folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for folders
CREATE POLICY "Users can view their own folders" 
ON public.folders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" 
ON public.folders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" 
ON public.folders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" 
ON public.folders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_folders_updated_at
BEFORE UPDATE ON public.folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Detail DNA Analysis Data (20260101230923)
-- Thêm analysis_data JSONB column để lưu extended DNA fields
ALTER TABLE public.dnas ADD COLUMN IF NOT EXISTS analysis_data JSONB;

-- 8. Script History (20260101233623)
-- Add history columns to scripts table for version tracking
ALTER TABLE public.scripts 
ADD COLUMN outline_history jsonb DEFAULT '[]'::jsonb,
ADD COLUMN script_history jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.scripts.outline_history IS 'Array of previous outline versions with timestamp';
COMMENT ON COLUMN public.scripts.script_history IS 'Array of previous script versions with timestamp';
