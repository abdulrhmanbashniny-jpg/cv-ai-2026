
## Unified Chat Architecture Overhaul

### Problem
6 agents have inconsistent behaviors: different pre-chat forms, some missing End Conversation, no quality survey, no unified session management.

### Phase 1: Shared Infrastructure (hooks + components)

**1.1 `useChatSession` hook** (`src/hooks/useChatSession.ts`)
- Manages: sessionId, visitor data (name, phone, role), messages, loading states, ended state
- Handles: streamChat, endConversation, file upload — all agent-agnostic
- Accepts: `agentType` parameter to route to correct prompt
- On end: generates refId, saves to consultations, triggers Telegram, triggers Google Sheet

**1.2 `PreChatForm` update**
- Add optional "Role/Entity" field (dropdown: موظف، صاحب منشأة، باحث عن عمل، أخرى)
- Keep existing: name, phone, PDPL consent
- For Consultation page: add category selector as extra field

**1.3 `QualitySurvey` component** (`src/components/QualitySurvey.tsx`)
- 3 questions shown after End Conversation:
  1. سهولة الخدمة (1-5 stars)
  2. جودة المخرجات (1-5 stars)  
  3. احتياجات مستقبلية (text field)
- Results saved alongside consultation record
- Triggers enhanced Telegram alert with scores

**1.4 `UnifiedChatWindow` component** (`src/components/UnifiedChatWindow.tsx`)
- Reusable chat UI: messages, input, file upload, end button
- Props: agentType, headerTitle, headerIcon, accentColor
- Integrates PreChatForm gate → Chat → End → Survey → Done

### Phase 2: Migrate Each Agent

| Agent | Current Location | Action |
|-------|-----------------|--------|
| A. career_twin | FloatingAIChat | Refactor to use UnifiedChatWindow |
| B. legal_advisor | Consultation page | Replace inline chat with UnifiedChatWindow + category field |
| C. cv_assistant | CareerGift page | Replace inline chat with UnifiedChatWindow |
| D. caio | Admin panel | Keep separate (admin-only, no visitor gate needed) |
| E. quality_scout | QualityScoutChat | Transform into post-end survey component (merged into flow) |
| F. template_architect | Templates page | Wrap with PreChatForm gate + UnifiedChatWindow |

### Phase 3: Edge Function Updates

- Add `survey_scores` field to end_conversation action
- Save survey data in consultations table (new columns: `survey_ease`, `survey_quality`, `survey_needs`)
- Include survey scores in Telegram alert
- Template Architect routing already exists in the prompt (Step B checks DB)

### Phase 4: Database Migration

- Add to `consultations` table: `survey_ease` (int), `survey_quality` (int), `survey_needs` (text), `visitor_phone` (text), `visitor_role` (text), `agent_type` (text)

### Phase 5: Admin Command Center

- Already built with RLHF in previous iteration
- Add realtime subscription to consultations table for live feed
- Session data flows through unified hook → consistent agent_type tagging

### Deliverables
- All 5 visitor-facing agents share identical PreChat → Chat → End → Survey flow
- CAIO remains admin-only with its own flow
- Single `useChatSession` hook manages all state
- Admin sees consistent, real-time data across all agents
