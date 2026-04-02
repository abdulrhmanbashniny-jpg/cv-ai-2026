
-- Create caio_sessions table
CREATE TABLE public.caio_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'جلسة استراتيجية جديدة',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.caio_sessions ENABLE ROW LEVEL SECURITY;

-- RLS: service_role full access
CREATE POLICY "Service role manages caio sessions"
ON public.caio_sessions FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- RLS: authenticated users can read
CREATE POLICY "Authenticated users can read caio sessions"
ON public.caio_sessions FOR SELECT TO authenticated
USING (true);

-- RLS: authenticated users can insert
CREATE POLICY "Authenticated users can insert caio sessions"
ON public.caio_sessions FOR INSERT TO authenticated
WITH CHECK (true);

-- RLS: authenticated users can update
CREATE POLICY "Authenticated users can update caio sessions"
ON public.caio_sessions FOR UPDATE TO authenticated
USING (true);

-- RLS: authenticated users can delete
CREATE POLICY "Authenticated users can delete caio sessions"
ON public.caio_sessions FOR DELETE TO authenticated
USING (true);

-- Add session_id to chat_logs (nullable for backward compatibility)
ALTER TABLE public.chat_logs ADD COLUMN session_id UUID REFERENCES public.caio_sessions(id) ON DELETE CASCADE;

-- Trigger for updated_at
CREATE TRIGGER update_caio_sessions_updated_at
BEFORE UPDATE ON public.caio_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
