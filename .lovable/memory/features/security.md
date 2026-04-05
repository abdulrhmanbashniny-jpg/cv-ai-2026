---
name: Security Hardening & PDPL
description: Agent sandboxing, PII masking, private storage, single-source Ref ID, standardized errors
type: feature
---
- cv-uploads bucket set to PRIVATE with service_role-only read policy
- PII masked in admin UI using src/lib/piiMask.ts (maskName, maskPhone)
- Agent sandboxing via AGENT_SCOPE_BOUNDARIES in chat edge function — out-of-scope queries get rejection + referral links
- Ref ID generated ONCE in edge function (server-side), returned to frontend — no client-side generation
- Edge function returns {success: false, error} on DB failures — frontend shows error modal instead of success
- Lovable badge hidden via publish settings
