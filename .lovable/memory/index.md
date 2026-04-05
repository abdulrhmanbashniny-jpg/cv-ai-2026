# Project Memory

## Core
RTL Arabic primary. Navy #001f3f, Gold #D4AF37, White. Noto Kufi Arabic + Playfair Display.
Personal brand platform for Abdulrahman Bashniny - HR & Legal Director.
Lovable Cloud enabled. Tables: job_applications, company_requests, consultations, ai_knowledge_base, chat_logs.
All 5 visitor agents use unified useChatSession hook + UnifiedChatWindow + PreChatForm + QualitySurvey.
cv-uploads bucket is PRIVATE. PII masked in admin UI via piiMask.ts. Lovable badge hidden.
Agent sandboxing enforced via AGENT_SCOPE_BOUNDARIES in edge function. Ref ID generated server-side only.

## Memories
- [Project scope](mem://features/scope) — Full platform features: careers portal, AI consultation, admin dashboard, Telegram/Drive integrations
- [Design system](mem://design/tokens) — Navy/Gold/White theme, RTL, custom CSS tokens and animations
- [Unified Chat Architecture](mem://features/unified-chat-architecture) — PreChat Gate → Chat → Survey → End flow for all agents, useChatSession hook
- [Security hardening](mem://features/security) — PDPL compliance, PII masking, private storage, agent sandboxing, single-source Ref ID
