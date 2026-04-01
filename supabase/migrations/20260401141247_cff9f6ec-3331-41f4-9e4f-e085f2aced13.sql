
-- Premium orders table
CREATE TABLE public.premium_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.premium_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert premium orders"
ON public.premium_orders FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Service role manages premium orders"
ON public.premium_orders FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Notification settings table
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL UNIQUE,
  event_label TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages notification settings"
ON public.notification_settings FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read notification settings"
ON public.notification_settings FOR SELECT TO public
USING (true);

-- Seed default notification settings
INSERT INTO public.notification_settings (event_type, event_label, is_enabled) VALUES
('new_download', 'تحميل نموذج جديد', true),
('new_message', 'رسالة جديدة', true),
('new_premium_order', 'طلب نموذج مميز', true),
('new_consultation', 'استشارة جديدة', true),
('new_job_application', 'طلب توظيف جديد', true),
('hot_lead', 'عميل محتمل (3+ تحميلات)', true);

-- Add triggers for updated_at
CREATE TRIGGER update_premium_orders_updated_at
BEFORE UPDATE ON public.premium_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
