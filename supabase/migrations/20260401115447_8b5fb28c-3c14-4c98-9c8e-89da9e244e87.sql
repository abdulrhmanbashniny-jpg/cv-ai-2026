
CREATE TABLE public.portfolio_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_key TEXT NOT NULL UNIQUE,
  content_ar TEXT,
  content_en TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read portfolio content"
ON public.portfolio_content
FOR SELECT
TO public
USING (true);

CREATE POLICY "Only service role can manage portfolio content"
ON public.portfolio_content
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Seed initial data
INSERT INTO public.portfolio_content (content_key, content_ar, content_en, category) VALUES
('bio', 'متخصص في بناء بيئات عمل احترافية، وتطوير السياسات التنظيمية، وتقديم الاستشارات في نظام العمل السعودي والأنظمة ذات العلاقة. بكالوريوس إدارة موارد بشرية من جامعة الملك عبدالعزيز، ورخصة استشارات عمالية معتمدة.', 'Specialized in building professional work environments, developing organizational policies, and providing consultations on Saudi Labor Law. Bachelor''s in HR Management from King Abdulaziz University, with a certified labor consultancy license.', 'general'),
('title', 'مدير تطوير الأعمال | مدير أول الموارد البشرية والشؤون القانونية', 'Business Development Manager | Senior HR & Legal Affairs Director', 'general'),
('experience_1', 'مساعد مدير الموارد البشرية - فندق راديسون بلو (2010-2013)', 'Assistant HR Manager - Radisson Blu Hotel (2010-2013)', 'experience'),
('experience_2', 'مسؤول الموارد البشرية - شركة الأغذية العربية للتموين (2013-2016)', 'HR Officer - Arab Food Catering Company (2013-2016)', 'experience'),
('experience_3', 'مدير مشاريع - نجوم الحفل للمعارض والمؤتمرات (2016-2018)', 'Project Manager - Nojoom Al-Hafl Exhibitions & Conferences (2016-2018)', 'experience'),
('experience_4', 'مدير الموارد البشرية والشؤون القانونية - مصنع دهانات وبلاستك جدة (مايو 2018 - ديسمبر 2025)', 'HR & Legal Affairs Manager - Jeddah Paints & Putty Factory Co. (May 2018 - Dec 2025)', 'experience'),
('experience_5', 'مدير تطوير الأعمال - مصنع دهانات وبلاستك جدة (يناير 2026 - الحاضر)', 'Business Development Manager - Jeddah Paints & Putty Factory Co. (Jan 2026 - Present)', 'experience'),
('skills', 'عمليات الموارد البشرية، الامتثال القانوني، تطوير السياسات، إدارة الأداء، العقود والاتفاقيات، التخطيط الاستراتيجي، التأمينات الاجتماعية، تطوير الأعمال', 'HR Operations, Legal Compliance, Policy Development, Performance Management, Contracts & Agreements, Strategic Planning, Social Insurance, Business Development', 'skills');
