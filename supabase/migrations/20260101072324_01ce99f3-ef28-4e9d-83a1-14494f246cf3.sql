-- Create tables for LOG Platform

-- Personas table
CREATE TABLE public.personas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    age_range TEXT,
    knowledge_level TEXT DEFAULT 'intermediate',
    pain_points TEXT[],
    preferred_tone TEXT,
    vocabulary TEXT,
    platform TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- DNAs table (viral patterns extracted from content)
CREATE TABLE public.dnas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    niche TEXT,
    source_url TEXT,
    source_transcript TEXT,
    hook_type TEXT,
    hook_examples TEXT[],
    structure TEXT[],
    pacing TEXT,
    retention_tactics TEXT[],
    x_factors TEXT[],
    tone TEXT,
    vocabulary TEXT,
    patterns TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Blueprints table (content structure templates)
CREATE TABLE public.blueprints (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sections JSONB NOT NULL DEFAULT '[]',
    estimated_length TEXT,
    dna_id UUID REFERENCES public.dnas(id) ON DELETE SET NULL,
    persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scripts table (generated content)
CREATE TABLE public.scripts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    topic TEXT,
    key_points TEXT,
    unique_angle TEXT,
    generation_mode TEXT DEFAULT 'hybrid',
    persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
    dna_id UUID REFERENCES public.dnas(id) ON DELETE SET NULL,
    blueprint_id UUID REFERENCES public.blueprints(id) ON DELETE SET NULL,
    blueprint_content JSONB,
    full_script TEXT,
    score INTEGER,
    score_breakdown JSONB,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notes table
CREATE TABLE public.notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    color TEXT DEFAULT 'bg-violet-100',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
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