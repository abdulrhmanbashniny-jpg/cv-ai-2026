
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS survey_ease integer,
  ADD COLUMN IF NOT EXISTS survey_quality integer,
  ADD COLUMN IF NOT EXISTS survey_needs text,
  ADD COLUMN IF NOT EXISTS visitor_phone text,
  ADD COLUMN IF NOT EXISTS visitor_role text,
  ADD COLUMN IF NOT EXISTS agent_type text;
