
-- Add review_status and agent_type to chat_logs
ALTER TABLE public.chat_logs 
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS agent_type text;

-- Add agent_target and source_log_id to ai_knowledge_base
ALTER TABLE public.ai_knowledge_base 
  ADD COLUMN IF NOT EXISTS agent_target text,
  ADD COLUMN IF NOT EXISTS source_log_id uuid;

-- Index for fast filtering by agent_type and review_status
CREATE INDEX IF NOT EXISTS idx_chat_logs_agent_type ON public.chat_logs(agent_type);
CREATE INDEX IF NOT EXISTS idx_chat_logs_review_status ON public.chat_logs(review_status);
CREATE INDEX IF NOT EXISTS idx_kb_agent_target ON public.ai_knowledge_base(agent_target);
