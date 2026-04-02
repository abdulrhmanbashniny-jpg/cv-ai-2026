import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_BASE64_SIZE = 5 * 1024 * 1024; // 5MB limit for multimodal content

const DEFAULT_CAREER_TWIN_PROMPT = `أنت عبدالرحمن باشنيني، مدير أول الموارد البشرية والشؤون القانونية بخبرة تفوق 15 عامًا. أنت خبير في نظام العمل السعودي واللوائح ذات العلاقة.

خلفيتك المهنية:
- مدير تطوير الأعمال في مصنع دهانات وبلاستك جدة (2026 - الحاضر)
- مدير الموارد البشرية والشؤون القانونية في مصنع دهانات وبلاستك جدة (2018 - 2025)
- مدير مشاريع في نجوم الحفل للمعارض والمؤتمرات (2016 - 2018)
- مسؤول موارد بشرية في شركة الأغذية العربية للتموين (2013 - 2016)
- مساعد مدير موارد بشرية في فندق راديسون بلو (2010 - 2013)

مؤهلاتك:
- بكالوريوس إدارة موارد بشرية من جامعة الملك عبدالعزيز (2018)
- رخصة استشارات عمالية

تعليمات:
- أجب بلغة المستخدم (عربي أو إنجليزي)
- كن محترفاً ودقيقاً في إجاباتك
- استند إلى نظام العمل السعودي عند الإجابة على الأسئلة القانونية
- إذا لم تكن متأكداً من الإجابة، قل: "سأستشير الأستاذ عبدالرحمن وأعود إليك بالرد"
- لا تختلق معلومات قانونية
- مهم جداً: خلال أي محادثة متعلقة بالمسيرة المهنية أو الموارد البشرية، اذكر بطريقة طبيعية: "بالمناسبة، يمكنني أيضاً تقديم استشارة مهنية مجانية لك أو مساعدتك في صياغة سيرتك الذاتية عبر أدواتنا المتخصصة في هذا الموقع. هل تودّ تجربتها؟"`;

const DEFAULT_LEGAL_ADVISOR_PROMPT = `أنت المستشار القانوني الذكي للأستاذ عبدالرحمن باشنيني. متخصص في نظام العمل السعودي وأنظمة العمل ذات العلاقة.

مهمتك:
- تقديم استشارات قانونية دقيقة مبنية على نظام العمل السعودي
- تشخيص المشكلات العمالية وتقديم الحلول
- الإشارة إلى المواد القانونية ذات الصلة
- تحديد ما إذا كانت الحالة تحتاج مراجعة بشرية
- إذا أرفق المستخدم ملفاً أو صورة، قم بتحليل محتواها وتقديم ملاحظات قانونية

تعليمات:
- أجب بلغة المستخدم
- كن دقيقاً في الإشارات القانونية
- إذا كانت الحالة معقدة، أشر إلى الحاجة لمراجعة بشرية
- لا تختلق مواد قانونية`;

const DEFAULT_CV_ASSISTANT_PROMPT = `أنت مساعد كتابة السيرة الذاتية المجاني من فريق الأستاذ عبدالرحمن باشنيني. مهمتك مساعدة الباحثين عن عمل في كتابة سيرة ذاتية احترافية بمعايير الموارد البشرية.

خطوات العمل:
1. اسأل عن الاسم الكامل والمسمى الوظيفي المستهدف
2. اسأل عن المؤهلات الأكاديمية
3. اسأل عن الخبرات العملية بالتفصيل
4. اسأل عن المهارات والدورات التدريبية
5. اسأل عن معلومات التواصل
6. قم بصياغة السيرة الذاتية بتنسيق Markdown احترافي

إذا أرفق المستخدم سيرة ذاتية قديمة (صورة أو ملف)، قم بتحليلها واقترح تحسينات.

تعليمات:
- اسأل سؤالاً واحداً في كل مرة
- كن مشجعاً وإيجابياً
- استخدم معايير HR احترافية
- قدم نصائح لتحسين المحتوى
- أجب بنفس لغة المستخدم`;

const DEFAULT_CAIO_PROMPT = `أنت كبير مسؤولي الذكاء الاصطناعي (CAIO) - الشريك الاستراتيجي الأول للمدير التنفيذي عبدالرحمن باشنيني. لست عبدالرحمن، بل أنت مستشاره الاستراتيجي الموثوق الذي يحلل بيانات المنصة ويقدم رؤى تنفيذية.

شخصيتك:
- نبرة تحليلية، تنفيذية، ومخلصة
- تخاطب عبدالرحمن بـ "سعادة المدير التنفيذي" أو "أستاذ عبدالرحمن"
- تقدم أرقاماً وتحليلات حقيقية مبنية على البيانات المتاحة
- تقترح استراتيجيات نمو قابلة للتنفيذ

ابدأ دائماً بـ: "أهلاً بك سعادة المدير التنفيذي أستاذ عبدالرحمن. قمت بتحليل أحدث البيانات في المنصة، وأنا جاهز لمناقشة استراتيجيات النمو معك."`;

function estimateBase64Size(content: any[]): number {
  let totalSize = 0;
  for (const item of content) {
    if (item.type === "image_url" && item.image_url?.url) {
      const url = item.image_url.url;
      if (url.startsWith("data:")) {
        const base64Part = url.split(",")[1] || "";
        totalSize += Math.ceil(base64Part.length * 0.75);
      }
    } else if (item.type === "text" && item.text) {
      totalSize += new TextEncoder().encode(item.text).length;
    }
  }
  return totalSize;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, consultation_id, agent, session_id, multimodal_content } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Base64 DoS protection: enforce 5MB limit on multimodal content
    if (multimodal_content && Array.isArray(multimodal_content)) {
      const contentSize = estimateBase64Size(multimodal_content);
      if (contentSize > MAX_BASE64_SIZE) {
        return new Response(
          JSON.stringify({ error: "Payload too large. Maximum file size is 5MB." }),
          { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine which agent and get custom prompt from settings
    const agentType = agent || "career_twin";
    const promptSettingKey = `agent_prompt_${agentType}`;

    let systemPromptBase: string;
    switch (agentType) {
      case "legal_advisor":
        systemPromptBase = DEFAULT_LEGAL_ADVISOR_PROMPT;
        break;
      case "cv_assistant":
        systemPromptBase = DEFAULT_CV_ASSISTANT_PROMPT;
        break;
      case "caio":
        systemPromptBase = DEFAULT_CAIO_PROMPT;
        break;
      default:
        systemPromptBase = DEFAULT_CAREER_TWIN_PROMPT;
    }

    // Check for custom prompt in admin_settings
    const { data: customPromptSetting } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", promptSettingKey)
      .maybeSingle();

    if (customPromptSetting?.setting_value?.trim()) {
      systemPromptBase = customPromptSetting.setting_value;
    }

    // Get active model from settings
    const { data: modelSetting } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "active_model")
      .maybeSingle();

    let activeModel = modelSetting?.setting_value || "google/gemini-3-flash-preview";
    if (multimodal_content && multimodal_content.length > 0) {
      activeModel = "google/gemini-2.5-flash";
    }

    const userMessage = messages[messages.length - 1]?.content || "";

    // === AGENT CONTEXT SANDBOXING ===
    // Each agent only receives the context relevant to its role

    let portfolioContext = "";
    let knowledgeContext = "";
    let dbSnapshot = "";

    // Portfolio context: only for career_twin (it IS Abdulrahman)
    if (agentType === "career_twin") {
      const { data: portfolioData } = await supabase
        .from("portfolio_content")
        .select("content_key, content_ar, content_en, category")
        .order("content_key");

      if (portfolioData && portfolioData.length > 0) {
        const cvLines = portfolioData.map((p) => `${p.content_key}: ${p.content_ar || ""} | ${p.content_en || ""}`).join("\n");
        portfolioContext = `\n\nبيانات السيرة الذاتية المحدّثة (استخدمها دائماً عند الإجابة عن خبرات ومؤهلات عبدالرحمن):\n${cvLines}`;
      }
    }

    // Knowledge base: only for career_twin and legal_advisor (not cv_assistant or caio)
    if (agentType === "career_twin" || agentType === "legal_advisor") {
      const { data: kbResults } = await supabase
        .from("ai_knowledge_base")
        .select("answer, question")
        .eq("is_active", true);

      if (kbResults && kbResults.length > 0) {
        const userLower = userMessage.toLowerCase();
        const matched = kbResults.filter(
          (kb) =>
            userLower.includes(kb.question.toLowerCase()) ||
            kb.question.toLowerCase().includes(userLower)
        );
        if (matched.length > 0) {
          knowledgeContext = `\n\nمعلومات من قاعدة المعرفة:\n${matched
            .map((m) => `س: ${m.question}\nج: ${m.answer}`)
            .join("\n\n")}`;
        }
      }
    }

    // CAIO: full database snapshot (admin-only agent)
    if (agentType === "caio") {
      const [
        { count: jobCount },
        { count: companyCount },
        { count: consultCount },
        { count: leadCount },
        { count: chatCount },
        { count: orderCount },
        { data: recentOrders },
        { data: topTemplates },
        { data: recentConsults },
        { data: recentJobApps },
      ] = await Promise.all([
        supabase.from("job_applications").select("*", { count: "exact", head: true }),
        supabase.from("company_requests").select("*", { count: "exact", head: true }),
        supabase.from("consultations").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("chat_logs").select("*", { count: "exact", head: true }),
        supabase.from("premium_orders").select("*", { count: "exact", head: true }),
        supabase.from("premium_orders").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("templates").select("title, downloads_count, type, category").order("downloads_count", { ascending: false }).limit(10),
        supabase.from("consultations").select("issue_category, status, created_at, visitor_name").order("created_at", { ascending: false }).limit(10),
        supabase.from("job_applications").select("full_name, department, city, status, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      const paidOrders = (recentOrders || []).filter((o: any) => o.status === "paid").length;
      const pendingOrders = (recentOrders || []).filter((o: any) => o.status === "pending").length;
      const categories = (recentConsults || []).reduce((acc: Record<string, number>, c: any) => { acc[c.issue_category] = (acc[c.issue_category] || 0) + 1; return acc; }, {});

      dbSnapshot = `\n\n=== لقطة بيانات المنصة الحية (Database Snapshot) ===
📊 الإحصائيات الإجمالية:
- طلبات التوظيف: ${jobCount || 0}
- طلبات الشركات: ${companyCount || 0}
- الاستشارات: ${consultCount || 0}
- العملاء المحتملون (Leads): ${leadCount || 0}
- إجمالي رسائل الدردشة: ${chatCount || 0}
- طلبات النماذج المميزة: ${orderCount || 0} (مدفوع: ${paidOrders}, معلق: ${pendingOrders})

📈 أكثر النماذج تحميلاً:
${(topTemplates || []).map((t: any, i: number) => `${i + 1}. ${t.title} (${t.downloads_count} تحميل) - ${t.type === "premium" ? "مميز 💎" : "مجاني"}`).join("\n")}

🏷️ فئات الاستشارات الأخيرة:
${Object.entries(categories).map(([k, v]) => `- ${k}: ${v}`).join("\n") || "لا توجد بيانات"}

📋 آخر طلبات التوظيف:
${(recentJobApps || []).slice(0, 5).map((j: any) => `- ${j.full_name} | ${j.department} | ${j.city} | ${j.status}`).join("\n") || "لا توجد"}

💰 آخر الطلبات المميزة:
${(recentOrders || []).slice(0, 5).map((o: any) => `- ${o.customer_name} | ${o.template_name} | ${o.status}`).join("\n") || "لا توجد"}
=== نهاية اللقطة ===`;
    }

    const systemPrompt = systemPromptBase + portfolioContext + knowledgeContext + dbSnapshot;

    // Build messages for the AI
    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // For CAIO sessions: fetch last 15 messages from DB for continuity
    if (agentType === "caio" && session_id) {
      const { data: sessionHistory } = await supabase
        .from("chat_logs")
        .select("role, message")
        .eq("session_id", session_id)
        .order("created_at", { ascending: true })
        .limit(15);

      if (sessionHistory && sessionHistory.length > 0) {
        // Add stored history before new messages
        for (const h of sessionHistory) {
          aiMessages.push({ role: h.role, content: h.message });
        }
      }

      // Check session status for greeting context
      const { data: sessionData } = await supabase
        .from("caio_sessions")
        .select("status, title")
        .eq("id", session_id)
        .maybeSingle();

      if (sessionData && (!sessionHistory || sessionHistory.length === 0)) {
        // New session - the system prompt already has greeting instruction
        aiMessages[0].content += "\n\nهذه جلسة استراتيجية جديدة بعنوان: \"" + (sessionData.title || "جلسة جديدة") + "\". ابدأ بتحية مناسبة.";
      }
    } else {
      // Non-session: use provided message history
      for (const msg of messages.slice(0, -1)) {
        aiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    if (multimodal_content && multimodal_content.length > 0) {
      aiMessages.push({ role: "user", content: multimodal_content });
    } else {
      aiMessages.push({ role: "user", content: userMessage });
    }

    // Save user message to chat_logs
    await supabase.from("chat_logs").insert({
      role: "user",
      message: userMessage,
      consultation_id: consultation_id || session_id || null,
    });

    // Call Lovable AI
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: activeModel,
          messages: aiMessages,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (fullResponse) {
              await supabase.from("chat_logs").insert({
                role: "assistant",
                message: fullResponse,
                consultation_id: consultation_id || session_id || null,
              });
            }
            controller.close();
            break;
          }
          controller.enqueue(value);

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && line.slice(6).trim() !== "[DONE]") {
              try {
                const parsed = JSON.parse(line.slice(6));
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) fullResponse += content;
              } catch { /* partial */ }
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
