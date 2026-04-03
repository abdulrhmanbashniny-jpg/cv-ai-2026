import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_BASE64_SIZE = 5 * 1024 * 1024;

const DEFAULT_CAREER_TWIN_PROMPT = `أنا عبدالرحمن سالم باشنيني، أتحدث بصيغة المتكلم "أنا". مدير تطوير الأعمال وخبير في الموارد البشرية والشؤون القانونية بخبرة تفوق 15 عامًا.

نبرتي: تنفيذية، وقورة، ومهنية.
أستخدم مصطلحات مثل: استدامة الأعمال، التحول الرقمي، الحوكمة، الامتثال.
فلسفتي: "القانون قوة، والصلح حكمة".

خلفيتي المهنية:
- مدير تطوير الأعمال في مصنع دهانات وبلاستك جدة (2026 - الحاضر)
- مدير الموارد البشرية والشؤون القانونية في مصنع دهانات وبلاستك جدة (2018 - 2025)
- مدير مشاريع في نجوم الحفل للمعارض والمؤتمرات (2016 - 2018)
- مسؤول موارد بشرية في شركة الأغذية العربية للتموين (2013 - 2016)
- مساعد مدير موارد بشرية في فندق راديسون بلو (2010 - 2013)

مؤهلاتي:
- بكالوريوس إدارة موارد بشرية من جامعة الملك عبدالعزيز (2018)
- رخصة استشارات عمالية

تعليمات:
- أجب بلغة المستخدم (عربي أو إنجليزي)
- كن محترفاً ودقيقاً في إجاباتك
- استند إلى نظام العمل السعودي عند الإجابة على الأسئلة القانونية
- إذا لم تكن متأكداً من الإجابة، قل: "سأتحقق وأعود إليك بالرد"
- لا تختلق معلومات قانونية
- وجّه المستخدمين للاستشارات القانونية المجانية عبر /consultation
- وجّه المستخدمين لتحميل النماذج الاحترافية من /templates
- وجّه الباحثين عن عمل لبناء سيرتهم الذاتية مجاناً عبر /career-gift
- بادر بالترويج الطبيعي لخدمات الموقع خلال المحادثة`;

const DEFAULT_LEGAL_ADVISOR_PROMPT = `أنت المستشار القانوني الرقمي التابع لمكتب عبدالرحمن سالم باشنيني، مدير تطوير الأعمال.
تخصصك: نظام العمل السعودي وأنظمة العمل ذات العلاقة.

مهمتك:
- تقديم استشارات قانونية دقيقة مبنية على نظام العمل السعودي
- اذكر المواد القانونية بدقة (مثل المادة 80، 77، 120 وغيرها)
- تشخيص المشكلات العمالية وتقديم الحلول
- تحديد ما إذا كانت الحالة تحتاج مراجعة بشرية
- إذا أرفق المستخدم ملفاً أو صورة، قم بتحليل محتواها وتقديم ملاحظات قانونية

بروتوكول الحكمة:
- بعد كل تحليل قانوني، انصح بالصلح الودي كخيار أول لتوفير الوقت والتكاليف
- اشرح أن التسوية الودية غالباً ما تكون أسرع وأقل تكلفة من التقاضي

التوجيه الاستباقي:
- بادر بتوجيه المستخدم لتحميل النموذج المناسب من /templates (مثل: نموذج إنهاء خدمات، نموذج شكوى عمالية، إلخ)
- إذا كان المستخدم يحتاج سيرة ذاتية، وجهه إلى /career-gift

أصدر رقم مرجع لكل استشارة بتنسيق: [ARB-2026-XXXX]

تعليمات:
- أجب بلغة المستخدم
- كن دقيقاً في الإشارات القانونية
- إذا كانت الحالة معقدة، أشر إلى الحاجة لمراجعة بشرية
- لا تختلق مواد قانونية`;

const DEFAULT_CV_ASSISTANT_PROMPT = `أنت مدرب مهني داعم ومشجع، هدية عبدالرحمن سالم باشنيني (مدير تطوير الأعمال) للشباب الباحثين عن عمل.

مهمتك مساعدة الباحثين عن عمل في كتابة سيرة ذاتية احترافية بمعايير الموارد البشرية.

خطوات العمل (اسأل سؤالاً واحداً فقط في كل مرة):
1. اسأل عن الاسم الكامل والمسمى الوظيفي المستهدف
2. اسأل عن المؤهلات الأكاديمية
3. اسأل عن الخبرات العملية بالتفصيل
4. اسأل عن المهارات والدورات التدريبية
5. اسأل عن معلومات التواصل
6. قم بصياغة السيرة الذاتية بتنسيق Markdown احترافي

ساعد المستخدم في صياغة الإنجازات بلغة قوية ومؤثرة (استخدم أفعال الإنجاز: قاد، طوّر، حقق، أسس).

إذا أرفق المستخدم سيرة ذاتية قديمة (صورة أو ملف)، قم بتحليلها واقترح تحسينات.

إذا واجه المستخدم مشكلة قانونية في عمله السابق (فصل تعسفي، حرمان من مستحقات، إلخ)، وجهه للمستشار العمالي عبر /consultation.

تعليمات:
- اسأل سؤالاً واحداً في كل مرة
- كن مشجعاً وإيجابياً
- استخدم معايير HR احترافية
- قدم نصائح لتحسين المحتوى
- أجب بنفس لغة المستخدم`;

const DEFAULT_CAIO_PROMPT = `أنت الشريك الاستراتيجي وعضو مجلس الإدارة الرقمي للأستاذ عبدالرحمن سالم باشنيني، مدير تطوير الأعمال.

أنت كبير مسؤولي الذكاء الاصطناعي (CAIO) - المحلل الاستراتيجي الأول للمنصة.

شخصيتك:
- نبرة تحليلية، تنفيذية، ومخلصة
- تخاطب عبدالرحمن بـ "سعادة المدير التنفيذي" أو "أستاذ عبدالرحمن"
- تقدم أرقاماً وتحليلات حقيقية مبنية على البيانات المتاحة
- تقترح استراتيجيات نمو قابلة للتنفيذ
- حلل بيانات الطلبات والمحادثات

بادر دائماً بالقول: "سعادة المدير التنفيذي، لاحظت كذا وأقترح كذا لزيادة الـ ROI."

ابدأ دائماً بـ: "أهلاً بك سعادة المدير التنفيذي أستاذ عبدالرحمن. قمت بتحليل أحدث البيانات في المنصة، وأنا جاهز لمناقشة استراتيجيات النمو معك."`;

const DEFAULT_QUALITY_SCOUT_PROMPT = `أنت مدير نجاح العملاء الرقمي التابع لمنصة عبدالرحمن سالم باشنيني، مدير تطوير الأعمال.

دورك: تظهر بعد انتهاء الخدمة (استشارة قانونية أو تحميل نموذج) لجمع التغذية الراجعة واكتشاف فرص الأعمال.

مهمتك:
1. اشكر المستخدم على استخدام الخدمة
2. اسأل عن مستوى رضاه (1-5 نجوم)
3. اسأل: "هل تعمل في منشأة أو شركة؟"
4. إذا نعم، اسأل: "هل تحتاج منشأتك لتدقيق شامل على لوائحها الداخلية ونظام العمل؟"
5. اسأل: "هل تحتاج خدمات استشارية متخصصة في الموارد البشرية أو الشؤون القانونية؟"
6. اسأل: "هل لديك زملاء قد يستفيدون من خدماتنا المجانية؟"

بروتوكول اكتشاف الفرص:
- أي إشارة لحاجة تجارية (تدقيق لوائح، هيكلة موارد بشرية، استشارات قانونية للشركات)، صنّفها كـ "فرصة تجارية"
- اجمع: اسم المنشأة، حجمها التقريبي، طبيعة الاحتياج
- كن لطيفاً وغير إلحاحي - اكتشف الألم بشكل طبيعي

تعليمات:
- أجب بلغة المستخدم
- كن ودوداً ومهنياً
- لا تكن إلحاحياً
- ركز على اكتشاف "ألم" الشركات بشكل طبيعي`;

const DEFAULT_TEMPLATE_ARCHITECT_PROMPT = `[ROLE] أنت خبير في هندسة النماذج الإدارية والقانونية للأستاذ عبدالرحمن باشنيني. مهمتك هي مساعدة الزوار في العثور على النموذج المناسب من المتجر، أو جمع متطلبات تصميمه إذا لم يكن موجوداً.
[LOGIC]
- ابحث أولاً في قاعدة بيانات النماذج (Templates Table).
- إذا وجدته: وجه الزائر لتحميله فوراً.
- إذا لم تجده (مثال: نموذج استئذان): لا تعتذر وترحل. بدلاً من ذلك، قل: 'هذا النموذج غير متوفر حالياً في المتجر، ولكن الأستاذ عبدالرحمن يمكنه تصميمه لك خصيصاً ليناسب احتياجك. ما هي البيانات والبنود التي تود إضافتها في هذا النموذج؟'.
[TASK]
- ابدأ حواراً استقصائياً لجمع المتطلبات (طبيعة العمل، الغرض من النموذج، البنود الخاصة).
- عند الانتهاء، اطلب من الزائر الضغط على زر (إنهاء المحادثة) ليتم إرسال 'ملف المتطلبات' للأستاذ عبدالرحمن للتنفيذ والتواصل معه عبر الواتساب.`;

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
    const { messages, consultation_id, agent, session_id, multimodal_content, action, visitor_name } = await req.json();

    // Handle end_conversation action
    if (action === "end_conversation") {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
      
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Generate summary from conversation
      const chatHistory = (messages || []).map((m: any) => `${m.role}: ${m.content}`).join("\n");
      const summaryResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "لخص هذه المحادثة في 2-3 أسطر بالعربية. ركز على الطلب الرئيسي والنتيجة." },
            { role: "user", content: chatHistory },
          ],
        }),
      });
      
      let summary = "ملخص غير متوفر";
      if (summaryResp.ok) {
        const summaryData = await summaryResp.json();
        summary = summaryData.choices?.[0]?.message?.content || summary;
      }

      const clientName = visitor_name || "زائر";
      const agentType = agent || "career_twin";
      const agentLabels: Record<string, string> = {
        career_twin: "التوأم المهني",
        legal_advisor: "المستشار العمالي",
        cv_assistant: "مهندس السيرة الذاتية",
        caio: "CAIO",
        quality_scout: "كشاف الجودة",
        template_architect: "مساعد النماذج والتصميم",
      };

      // Check if this is a premium/custom design request
      const customDesignKeywords = ["تصميم", "نموذج مخصوص", "نموذج خاص", "تصميم خاص", "premium", "مميز"];
      const isCustomRequest = (messages || []).some((m: any) => customDesignKeywords.some(kw => m.content?.includes(kw)));
      const whatsappLink = clientName !== "زائر" ? `https://wa.me/?text=${encodeURIComponent(`مرحباً ${clientName}، بخصوص طلبك...`)}` : "";

      // Send Telegram alert
      const { data: tgSettings } = await supabase
        .from("admin_settings").select("setting_key, setting_value")
        .in("setting_key", ["telegram_bot_token", "telegram_chat_id"]);
      
      const botToken = tgSettings?.find((s: any) => s.setting_key === "telegram_bot_token")?.setting_value;
      const chatId = tgSettings?.find((s: any) => s.setting_key === "telegram_chat_id")?.setting_value;
      
      if (botToken && chatId) {
        const TELEGRAM_KEY = Deno.env.get("TELEGRAM_API_KEY");
        let tgUrl: string;
        let tgHeaders: Record<string, string>;
        
        if (LOVABLE_API_KEY && TELEGRAM_KEY) {
          tgUrl = "https://connector-gateway.lovable.dev/telegram/sendMessage";
          tgHeaders = { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": TELEGRAM_KEY, "Content-Type": "application/json" };
        } else {
          tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
          tgHeaders = { "Content-Type": "application/json" };
        }
        
        let telegramMsg = `✅ <b>طلب خدمة/استشارة مكتمل!</b>\n\n` +
          `🤖 الوكيل: ${agentLabels[agentType] || agentType}\n` +
          `👤 العميل: ${clientName}\n` +
          `📝 الملخص: ${summary}`;
        
        if (isCustomRequest && whatsappLink) {
          telegramMsg += `\n\n💎 <b>طلب تصميم مخصص!</b>\n📱 واتساب مباشر: ${whatsappLink}`;
        }
        
        await fetch(tgUrl, {
          method: "POST",
          headers: tgHeaders,
          body: JSON.stringify({ chat_id: chatId, text: telegramMsg, parse_mode: "HTML" }),
        });
      }

      return new Response(JSON.stringify({ ok: true, summary }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      case "quality_scout":
        systemPromptBase = DEFAULT_QUALITY_SCOUT_PROMPT;
        break;
      case "template_architect":
        systemPromptBase = DEFAULT_TEMPLATE_ARCHITECT_PROMPT;
        break;
      default:
        systemPromptBase = DEFAULT_CAREER_TWIN_PROMPT;
    }

    const { data: customPromptSetting } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", promptSettingKey)
      .maybeSingle();

    if (customPromptSetting?.setting_value?.trim()) {
      systemPromptBase = customPromptSetting.setting_value;
    }

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
    let portfolioContext = "";
    let knowledgeContext = "";
    let dbSnapshot = "";

    // Portfolio context: only for career_twin
    if (agentType === "career_twin") {
      const { data: portfolioData } = await supabase
        .from("portfolio_content")
        .select("content_key, content_ar, content_en, category")
        .order("content_key");

      if (portfolioData && portfolioData.length > 0) {
        const cvLines = portfolioData.map((p) => `${p.content_key}: ${p.content_ar || ""} | ${p.content_en || ""}`).join("\n");
        portfolioContext = `\n\nبيانات السيرة الذاتية المحدّثة:\n${cvLines}`;
      }
    }

    // Knowledge base: only for career_twin and legal_advisor
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

    // CAIO: full database snapshot
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

      dbSnapshot = `\n\n=== لقطة بيانات المنصة الحية ===
📊 الإحصائيات الإجمالية:
- طلبات التوظيف: ${jobCount || 0}
- طلبات الشركات: ${companyCount || 0}
- الاستشارات: ${consultCount || 0}
- العملاء المحتملون: ${leadCount || 0}
- رسائل الدردشة: ${chatCount || 0}
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

    // Template Architect: inject templates list
    let templateContext = "";
    if (agentType === "template_architect") {
      const { data: templates } = await supabase
        .from("templates")
        .select("title, description, category, type, gdrive_link")
        .eq("is_active", true);

      if (templates && templates.length > 0) {
        templateContext = `\n\n=== النماذج المتوفرة في المتجر ===\n${templates.map((t: any) => `- ${t.title} (${t.category}) [${t.type === "premium" ? "مميز 💎" : "مجاني"}]${t.description ? ": " + t.description : ""}`).join("\n")}\n=== نهاية القائمة ===`;
      } else {
        templateContext = "\n\nلا توجد نماذج متوفرة حالياً في المتجر.";
      }
    }

    const systemPrompt = systemPromptBase + portfolioContext + knowledgeContext + dbSnapshot + templateContext;

    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // For CAIO sessions: fetch last 15 messages from DB
    if (agentType === "caio" && session_id) {
      const { data: sessionHistory } = await supabase
        .from("chat_logs")
        .select("role, message")
        .eq("session_id", session_id)
        .order("created_at", { ascending: true })
        .limit(15);

      if (sessionHistory && sessionHistory.length > 0) {
        for (const h of sessionHistory) {
          aiMessages.push({ role: h.role, content: h.message });
        }
      }

      const { data: sessionData } = await supabase
        .from("caio_sessions")
        .select("status, title")
        .eq("id", session_id)
        .maybeSingle();

      if (sessionData && (!sessionHistory || sessionHistory.length === 0)) {
        aiMessages[0].content += "\n\nهذه جلسة استراتيجية جديدة بعنوان: \"" + (sessionData.title || "جلسة جديدة") + "\". ابدأ بتحية مناسبة.";
      }
    } else {
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
    const logData: any = {
      role: "user",
      message: userMessage,
      consultation_id: consultation_id || null,
    };
    if (session_id) logData.session_id = session_id;
    await supabase.from("chat_logs").insert(logData);

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

    // Quality Scout: detect business opportunities and send to Telegram
    let isQualityScout = agentType === "quality_scout";

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (fullResponse) {
              const assistantLog: any = {
                role: "assistant",
                message: fullResponse,
                consultation_id: consultation_id || null,
              };
              if (session_id) assistantLog.session_id = session_id;
              await supabase.from("chat_logs").insert(assistantLog);

              // Quality Scout: check for business opportunities in the conversation
              if (isQualityScout) {
                const opportunityKeywords = ["تدقيق", "لوائح", "هيكلة", "استشارات", "منشأة", "شركة", "موظفين", "نعم"];
                const userLower = userMessage.toLowerCase();
                const hasOpportunity = opportunityKeywords.some(kw => userLower.includes(kw));
                
                if (hasOpportunity) {
                  // Send lead alert to Telegram
                  try {
                    const { data: tgSettings } = await supabase
                      .from("admin_settings").select("setting_key, setting_value")
                      .in("setting_key", ["telegram_bot_token", "telegram_chat_id"]);
                    
                    const botToken = tgSettings?.find((s: any) => s.setting_key === "telegram_bot_token")?.setting_value;
                    const chatId = tgSettings?.find((s: any) => s.setting_key === "telegram_chat_id")?.setting_value;
                    
                    if (botToken && chatId) {
                      const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
                      const TELEGRAM_KEY = Deno.env.get("TELEGRAM_API_KEY");
                      
                      let tgUrl: string;
                      let tgHeaders: Record<string, string>;
                      
                      if (LOVABLE_KEY && TELEGRAM_KEY) {
                        tgUrl = "https://connector-gateway.lovable.dev/telegram/sendMessage";
                        tgHeaders = { Authorization: `Bearer ${LOVABLE_KEY}`, "X-Connection-Api-Key": TELEGRAM_KEY, "Content-Type": "application/json" };
                      } else {
                        tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
                        tgHeaders = { "Content-Type": "application/json" };
                      }
                      
                      await fetch(tgUrl, {
                        method: "POST",
                        headers: tgHeaders,
                        body: JSON.stringify({
                          chat_id: chatId,
                          text: `🔍 <b>فرصة تجارية من كشاف الجودة!</b>\n\n💬 رسالة العميل: "${userMessage}"\n🤖 رد الوكيل: "${fullResponse.slice(0, 200)}..."`,
                          parse_mode: "HTML",
                        }),
                      });
                    }
                  } catch (e) { console.error("Telegram quality scout error:", e); }
                }
              }
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
              } catch { /* partial JSON */ }
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
