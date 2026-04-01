
-- Templates table for digital products store
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  type TEXT NOT NULL DEFAULT 'free' CHECK (type IN ('free', 'premium')),
  gdrive_link TEXT,
  downloads_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Public can read templates (but we'll exclude gdrive_link in the frontend query)
CREATE POLICY "Anyone can read active templates"
  ON public.templates FOR SELECT
  USING (true);

-- Only service role can manage templates
CREATE POLICY "Service role manages templates"
  ON public.templates FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Leads table for lead capture
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'موظف',
  downloaded_templates UUID[] DEFAULT '{}',
  downloads_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert leads (via edge function with service role, but allow public insert too)
CREATE POLICY "Anyone can insert leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- Only service role can read/manage leads
CREATE POLICY "Service role manages leads"
  ON public.leads FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
