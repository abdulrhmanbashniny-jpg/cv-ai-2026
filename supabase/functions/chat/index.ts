import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine which agent and get custom prompt from settings
    const agentType = agent || "career_twin";
    const promptSettingKey = `agent_prompt_${agentType}`;
    
    let systemPromptBase = DEFAULT_CAREER_TWIN_PROMPT;
    if (agentType === "legal_advisor") systemPromptBase = DEFAULT_LEGAL_ADVISOR_PROMPT;
    if (agentType === "cv_assistant") systemPromptBase = DEFAULT_CV_ASSISTANT_PROMPT;

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
    
    // Use a vision-capable model when multimodal content is present
    let activeModel = modelSetting?.setting_value || "google/gemini-3-flash-preview";
    if (multimodal_content && multimodal_content.length > 0) {
      activeModel = "google/gemini-2.5-flash"; // Vision-capable model
    }

    // Get the latest user message
    const userMessage = messages[messages.length - 1]?.content || "";

    // Fetch dynamic portfolio content for AI context
    const { data: portfolioData } = await supabase
      .from("portfolio_content")
      .select("content_key, content_ar, content_en, category")
      .order("content_key");

    let portfolioContext = "";
    if (portfolioData && portfolioData.length > 0) {
      const cvLines = portfolioData.map((p) => `${p.content_key}: ${p.content_ar || ""} | ${p.content_en || ""}`).join("\n");
      portfolioContext = `\n\nبيانات السيرة الذاتية المحدّثة (استخدمها دائماً عند الإجابة عن خبرات ومؤهلات عبدالرحمن):\n${cvLines}`;
    }

    // Check knowledge base
    const { data: kbResults } = await supabase
      .from("ai_knowledge_base")
      .select("answer, question")
      .eq("is_active", true);

    let knowledgeContext = "";
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

    const systemPrompt = systemPromptBase + portfolioContext + knowledgeContext;

    // Build messages for the AI - handle multimodal content
    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    for (const msg of messages.slice(0, -1)) {
      aiMessages.push({ role: msg.role, content: msg.content });
    }

    // Handle the last message - potentially multimodal
    if (multimodal_content && multimodal_content.length > 0) {
      aiMessages.push({
        role: "user",
        content: multimodal_content,
      });
    } else {
      aiMessages.push({ role: "user", content: userMessage });
    }

    // Save user message to chat_logs with session_id
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
