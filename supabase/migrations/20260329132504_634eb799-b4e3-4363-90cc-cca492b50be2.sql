-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Job Applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  department TEXT NOT NULL,
  cv_url TEXT,
  cv_drive_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert job applications" ON public.job_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Only service role can read job applications" ON public.job_applications FOR SELECT USING (false);

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Company Requests table
CREATE TABLE public.company_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  hiring_needs TEXT NOT NULL,
  job_titles TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.company_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert company requests" ON public.company_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Only service role can read company requests" ON public.company_requests FOR SELECT USING (false);

CREATE TRIGGER update_company_requests_updated_at BEFORE UPDATE ON public.company_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Consultations table
CREATE TABLE public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT NOT NULL UNIQUE,
  visitor_name TEXT,
  issue_category TEXT NOT NULL,
  summary TEXT,
  ai_response TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  needs_human_review BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert consultations" ON public.consultations FOR INSERT WITH CHECK (true);
CREATE POLICY "Only service role can read consultations" ON public.consultations FOR SELECT USING (false);

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON public.consultations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AI Knowledge Base table
CREATE TABLE public.ai_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only service role can manage knowledge base" ON public.ai_knowledge_base FOR ALL USING (false);

CREATE TRIGGER update_ai_knowledge_base_updated_at BEFORE UPDATE ON public.ai_knowledge_base
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Chat Logs table
CREATE TABLE public.chat_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert chat logs" ON public.chat_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Only service role can read chat logs" ON public.chat_logs FOR SELECT USING (false);

-- Storage bucket for CVs
INSERT INTO storage.buckets (id, name, public) VALUES ('cv-uploads', 'cv-uploads', false);
CREATE POLICY "Anyone can upload CVs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cv-uploads');
CREATE POLICY "Service role can read CVs" ON storage.objects FOR SELECT USING (bucket_id = 'cv-uploads');