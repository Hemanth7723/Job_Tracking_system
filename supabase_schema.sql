-- 1. Create the jobs table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
    company_name TEXT NOT NULL,
    role_name TEXT NOT NULL,
    job_link TEXT,
    resume_file TEXT, -- Stores the path/name of the file in storage
    status TEXT NOT NULL CHECK (status IN ('Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn', 'Ghosted')),
    location TEXT,
    ctc TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies (Matches PocketBase rules)
CREATE POLICY "Users can view their own jobs"
ON public.jobs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs"
ON public.jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
ON public.jobs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs"
ON public.jobs FOR DELETE
USING (auth.uid() = user_id);

-- 4. Set up Storage for Resumes
-- Run this to create the bucket (or create it manually in the dashboard)
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- Storage Policies
CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
