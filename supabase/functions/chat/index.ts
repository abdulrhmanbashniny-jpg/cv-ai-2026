import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_BASE64_SIZE = 5 * 1024 * 1024;

// ========== AGENT SANDBOXING: STRICT SCOPE BOUNDARIES ==========
const AGENT_SCOPE_BOUNDARIES: Record<string, { scope: string; rejectMessage: string }> = {
  career_twin: {
    scope: "الموارد البشرية، المسار المهني، تطوير الأعمال، السيرة الذاتية لعبدالرحمن باشنيني",
    rejectMessage: `⚠️ هذا السؤال خارج نطاق تخصصي كتوأم مهني.

🔹 للاستشارات القانونية والعمالية → توجه إلى [المستشار العمالي](/consultation)
🔹 لبناء سيرتك الذاتية → توجه إلى [مهندس السيرة الذاتية](/career-gift)
🔹 لتحميل نماذج إدارية → توجه إلى [مساعد النماذج](/templates)

كيف يمكنني مساعدتك في مجال الموارد البشرية وتطوير الأعمال؟`,
  },
  legal_advisor: {
    scope: "نظام العمل السعودي، الاستشارات القانونية العمالية، المواد القانونية، حقوق العمال وأصحاب العمل، الفصل التعسفي، مكافأة نهاية الخدمة",
    rejectMessage: `⚠️ هذا السؤال خارج نطاق الاستشارات العمالية والقانونية.

🔹 للمسار المهني وتطوير الأعمال → توجه إلى [التوأم المهني](/) (الدردشة العائمة)
🔹 لبناء سيرتك الذاتية → توجه إلى [مهندس السيرة الذاتية](/career-gift)
🔹 لتحميل نماذج إدارية → توجه إلى [مساعد النماذج](/templates)

كيف يمكنني مساعدتك في الاستشارات القانونية والعمالية؟`,
  },
  cv_assistant: {
    scope: "كتابة السيرة الذاتية، المهارات، الخبرات، المؤهلات، التقديم على الوظائف، نصائح المقابلات",
    rejectMessage: `⚠️ هذا السؤال خارج نطاق مساعدة السيرة الذاتية.

🔹 للاستشارات القانونية → توجه إلى [المستشار العمالي](/consultation)
🔹 للمسار المهني → توجه إلى [التوأم المهني](/) (الدردشة العائمة)
🔹 لتحميل نماذج إدارية → توجه إلى [مساعد النماذج](/templates)

كيف يمكنني مساعدتك في بناء سيرتك الذاتية؟`,
  },
  caio: {
    scope: "تحليل بيانات المنصة، استراتيجيات النمو، التقارير التنفيذية، مؤشرات الأداء",
    rejectMessage: "هذا خارج نطاق التحليل الاستراتيجي. يرجى توجيه السؤال للوكيل المختص.",
  },
  quality_scout: {
    scope: "تقييم الخدمة، التغذية الراجعة، اكتشاف فرص الأعمال، رضا العملاء",
    rejectMessage: "يرجى التركيز على تقييم الخدمة واحتياجاتك المستقبلية.",
  },
  template_architect: {
    scope: "النماذج الإدارية، تصميم النماذج، اللوائح الداخلية، نماذج الموارد البشرية، العقود",
    rejectMessage: `⚠️ هذا السؤال خارج نطاق مساعدة النماذج والتصميم.

🔹 للاستشارات القانونية → توجه إلى [المستشار العمالي](/consultation)
🔹 للمسار المهني → توجه إلى [التوأم المهني](/) (الدردشة العائمة)
🔹 لبناء سيرتك الذاتية → توجه إلى [مهندس السيرة الذاتية](/career-gift)

كيف يمكنني مساعدتك في النماذج الإدارية؟`,
  },
};

const DEFAULT_CAREER_TWIN_PROMPT = `أنا عبدالرحمن سالم باشنيني، أتحدث بصيغة المتكلم "أنا". مدير تطوير الأعمال وخبير في الموارد البشرية والشؤون القانونية بخبرة تفوق 15 عامًا.

نبرتي: تنفيذية، وقورة، ومهنية.
أستخدم مصطلحات مثل: استدامة الأعمال، التحول الرقمي، الحوكمة، الامتثال.
فلسفتي ومبدأ جميع وكلائي: "القانون قوة، والصلح حكمة" (بروتوكول حكمة باشنيني).

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

بروتوكول حكمة باشنيني - "القانون قوة، والصلح حكمة":
- بعد كل تحليل قانوني، انصح بالصلح الودي كخيار أول لتوفير الوقت والتكاليف
- اشرح أن التسوية الودية غالباً ما تكون أسرع وأقل تكلفة من التقاضي

التوجيه الاستباقي:
- بادر بتوجيه المستخدم لتحميل النموذج المناسب من /templates (مثل: نموذج إنهاء خدمات، نموذج شكوى عمالية، إلخ)
- إذا كان المستخدم يحتاج سيرة ذاتية، وجهه إلى /career-gift

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

إذا واجه المستخدم مشكلة قانونية في عمله السابق (فصل تعسفي، حرمان من مستحقات، إلخ)، وجهه للمستشار العمالي عبر /consultation وذكّره بمبدأ "القانون قوة، والصلح حكمة".

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
- تقدم أرقاماً وتحليلات حقيقية مبنية على البيانات المتاحة فقط
- تقترح استراتيجيات نمو قابلة للتنفيذ وفق مبدأ "القانون قوة، والصلح حكمة"
- حلل بيانات الطلبات والمحادثات

تعليمات صارمة:
- إذا كان عدد أي جدول = 0، قل بوضوح: "هذا الجدول فارغ حالياً (0 سجلات)"
- لا تفترض أو تختلق أي بيانات غير موجودة في اللقطة المرفقة أدناه
- كل رقم تذكره يجب أن يكون من اللقطة الفعلية المرفقة
- إذا لم تجد بيانات كافية للتحليل، قل: "البيانات غير كافية لإجراء هذا التحليل"

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
- ركز على اكتشاف "ألم" الشركات بشكل طبيعي
- طبّق مبدأ "القانون قوة، والصلح حكمة" عند اكتشاف فرص قانونية`;

const DEFAULT_TEMPLATE_ARCHITECT_PROMPT = `[ROLE] أنت مساعد النماذج والتصميم الرقمي للأستاذ عبدالرحمن سالم باشنيني، مدير تطوير الأعمال. أنت خبير في هندسة النماذج الإدارية والقانونية.

[STEP A - الترحيب الإلزامي]
ابدأ دائماً بإخلاء المسؤولية: "تنويه: هذا المساعد أداة استرشادية ولا يُغني عن الاستشارة المهنية المباشرة."
ثم رحب بالمستخدم واسأله عن احتياجه.

[STEP B - فحص قاعدة البيانات]
عندما يطلب المستخدم نموذجاً، ابحث في قائمة النماذج المتوفرة المرفقة أدناه.
- إذا وجدته: قل "نعم، هذا النموذج متوفر في مكتبتنا! يمكنك تحميله مباشرة من صفحة النماذج." واذكر اسمه ونوعه (مجاني/مميز). لا ترسل تقرير متطلبات في هذه الحالة.

[STEP C - وضع الاستشاري]
- إذا لم تجد النموذج المطلوب: قل بالضبط: "هذا النموذج غير متوفر حالياً في المكتبة الجاهزة، ولكن الأستاذ عبدالرحمن وفريقه يمكنهم تصميمه لك خصيصاً ليناسب احتياجك."

[STEP D - جمع المتطلبات - فقط عند عدم وجود النموذج]
ابدأ بطرح أسئلة استقصائية واحداً تلو الآخر:
1. "ما هو نوع نشاط منشأتك؟"
2. "ما هو الغرض الرئيسي من هذا النموذج؟"
3. "ما هي أهم الخانات والحقول التي تود إضافتها؟"
4. "هل هناك بنود قانونية معينة تود إدراجها؟"
5. "هل تريد إضافة شعار الشركة أو أي عناصر بصرية خاصة؟"

[STEP E - الإغلاق]
بعد جمع المتطلبات الكافية، قل: "رائع، لقد قمت بجمع كافة التفاصيل المطلوبة. سأقوم بإرسال طلبك الآن للأستاذ عبدالرحمن ليدرسه ويتواصل معك عبر الواتساب."

[STEP F - الرقم المرجعي]
لا تقم بتوليد أي رقم مرجعي بنفسك. الرقم المرجعي يُولّد تلقائياً عند إنهاء المحادثة.
قل: "يرجى الضغط على زر (إنهاء المحادثة وإرسال التقرير) الآن لإتمام إرسال طلبك والحصول على رقمك المرجعي."

[تعليمات عامة]
- أجب بلغة المستخدم
- كن مهنياً ومحترفاً
- لا تختلق نماذج غير موجودة في القائمة
- اسأل سؤالاً واحداً في كل مرة عند جمع المتطلبات
- طبّق مبدأ "القانون قوة، والصلح حكمة" (بروتوكول حكمة باشنيني)`;


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

// Helper: generate reference ID — SINGLE SOURCE OF TRUTH
function generateRefId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `ARB-2026-${num}`;
}

// Helper: send Telegram message
async function sendTelegramAlert(supabase: any, text: string) {
  try {
    const { data: tgSettings } = await supabase
      .from("admin_settings").select("setting_key, setting_value")
      .in("setting_key", ["telegram_bot_token", "telegram_chat_id"]);

    const botToken = tgSettings?.find((s: any) => s.setting_key === "telegram_bot_token")?.setting_value;
    const chatId = tgSettings?.find((s: any) => s.setting_key === "telegram_chat_id")?.setting_value;
    if (!botToken || !chatId) { console.error("Telegram not configured"); return; }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
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

    const resp = await fetch(tgUrl, {
      method: "POST",
      headers: tgHeaders,
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Telegram send failed:", resp.status, errText);
    }
  } catch (e) { console.error("Telegram alert error:", e); }
}

// Helper: send to Google Apps Script
async function sendToGoogleSheet(payload: { ref: string; name: string; phone: string; city: string; dept: string }) {
  const gasUrl = Deno.env.get("GOOGLE_APPS_SCRIPT_URL");
  if (!gasUrl) {
    console.log("GOOGLE_APPS_SCRIPT_URL not configured, skipping sheet sync");
    return;
  }
  try {
    const resp = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Google Apps Script failed:", resp.status, errText);
    } else {
      console.log("Google Sheet sync OK for", payload.ref);
    }
  } catch (e) { console.error("Google Apps Script error:", e); }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, consultation_id, agent, session_id, multimodal_content, action, visitor_name, visitor_phone, visitor_role, survey_scores } = await req.json();

    // ========== END CONVERSATION ==========
    if (action === "end_conversation") {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: "Server configuration error", success: false }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const chatHistory = (messages || []).map((m: any) => `${m.role}: ${m.content}`).join("\n");
      const agentType = agent || "career_twin";
      const isTemplateArchitect = agentType === "template_architect";

      // Generate summary
      const summarySystemPrompt = isTemplateArchitect
        ? `أنت كاتب تقارير احترافي. قم بكتابة "تقرير متطلبات تصميم نموذج" بناءً على المحادثة التالية. التقرير يجب أن يتضمن:
1. نوع النموذج المطلوب
2. طبيعة نشاط المنشأة
3. الغرض من النموذج
4. الحقول والبنود المطلوبة
5. أي متطلبات خاصة
اكتب التقرير بشكل مهني ومختصر بالعربية.`
        : "لخص هذه المحادثة في 2-3 أسطر بالعربية. ركز على الطلب الرئيسي والنتيجة.";

      const summaryResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: summarySystemPrompt },
            { role: "user", content: chatHistory },
          ],
        }),
      });

      let summary = "ملخص غير متوفر";
      if (summaryResp.ok) {
        const summaryData = await summaryResp.json();
        summary = summaryData.choices?.[0]?.message?.content || summary;
      }

      // ===== SINGLE REF ID — generated ONCE here, used EVERYWHERE =====
      const refId = generateRefId();

      // Robust lead mapping
      let clientName = visitor_name || "";
      let clientPhone = visitor_phone || "";
      let clientRole = "";

      if (clientPhone) {
        const { data: leadData } = await supabase
          .from("leads")
          .select("name, phone, role")
          .eq("phone", clientPhone)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (leadData) {
          clientName = leadData.name || clientName;
          clientPhone = leadData.phone || clientPhone;
          clientRole = leadData.role || "";
        }
      }

      if (!clientName || clientName === "زائر") {
        if (visitor_name && visitor_name !== "زائر") {
          const { data: leadByName } = await supabase
            .from("leads")
            .select("name, phone, role")
            .eq("name", visitor_name)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (leadByName) {
            clientName = leadByName.name;
            clientPhone = leadByName.phone || clientPhone;
            clientRole = leadByName.role || "";
          } else {
            clientName = visitor_name;
          }
        }
      }

      if (!clientName) clientName = "زائر";

      // ===== MANDATORY DB COMMITS WITH ERROR CHECKING =====
      const errors: string[] = [];
      
      // 1. Save all chat messages to chat_logs
      const chatMessages = (messages || []).filter((m: any) => m.role && m.content);
      if (chatMessages.length > 0) {
        const logRows = chatMessages.map((m: any) => ({
          role: m.role,
          message: m.content,
          consultation_id: consultation_id || null,
          session_id: session_id || null,
          agent_type: agentType,
        }));

        const { error: chatLogError } = await supabase.from("chat_logs").insert(logRows);
        if (chatLogError) {
          console.error("CRITICAL: chat_logs insert failed:", chatLogError);
          errors.push("chat_logs");
        } else {
          console.log(`✅ chat_logs: ${logRows.length} messages saved`);
        }
      }

      // 2. Upsert lead data
      if (clientPhone && clientName && clientName !== "زائر") {
        const { data: existingLead } = await supabase
          .from("leads")
          .select("id")
          .eq("phone", clientPhone)
          .maybeSingle();

        if (existingLead) {
          const { error: leadUpdateError } = await supabase
            .from("leads")
            .update({ name: clientName, role: clientRole || "موظف" })
            .eq("id", existingLead.id);
          if (leadUpdateError) console.error("WARNING: lead update failed:", leadUpdateError);
          else console.log("✅ Lead updated:", clientName);
        } else {
          const { error: leadInsertError } = await supabase
            .from("leads")
            .insert({
              name: clientName,
              phone: clientPhone,
              email: `${clientPhone}@chat.visitor`,
              role: clientRole || "موظف",
            });
          if (leadInsertError) console.error("WARNING: lead insert failed:", leadInsertError);
          else console.log("✅ Lead created:", clientName);
        }
      }

      // 3. Save summary as final assistant message
      const { error: summaryLogError } = await supabase.from("chat_logs").insert({
        role: "assistant",
        message: `[ملخص - ${refId}] ${summary}`,
        consultation_id: consultation_id || null,
        session_id: session_id || null,
        agent_type: agentType,
      });
      if (summaryLogError) console.error("WARNING: summary log insert failed:", summaryLogError);

      // 4. Send to Google Sheet
      await sendToGoogleSheet({
        ref: refId,
        name: clientName,
        phone: clientPhone,
        city: "غير محدد",
        dept: agentType === "template_architect" ? "طلب تصميم نموذج" : "استشارة/خدمة",
      });

      // 5. Save consultation record — THE SAME refId
      const consultationData: any = {
        visitor_name: clientName,
        visitor_phone: clientPhone,
        visitor_role: visitor_role || clientRole || "",
        issue_category: agentType === "legal_advisor" ? "استشارة عمالية" : agentType === "template_architect" ? "طلب تصميم نموذج" : "خدمة عامة",
        reference_number: refId,
        summary: summary,
        ai_response: chatHistory.slice(0, 5000),
        status: "closed",
        agent_type: agentType,
        needs_human_review: false,
      };

      if (survey_scores) {
        if (survey_scores.ease) consultationData.survey_ease = survey_scores.ease;
        if (survey_scores.quality) consultationData.survey_quality = survey_scores.quality;
        if (survey_scores.needs) consultationData.survey_needs = survey_scores.needs;
      }

      const { error: consultError } = await supabase.from("consultations").insert(consultationData);
      if (consultError) {
        console.error("CRITICAL: consultation insert failed:", consultError);
        errors.push("consultations");
      } else {
        console.log("✅ Consultation saved:", refId);
      }

      // 6. Send Telegram alert — THE SAME refId
      const agentLabels: Record<string, string> = {
        career_twin: "التوأم المهني",
        legal_advisor: "المستشار العمالي",
        cv_assistant: "مهندس السيرة الذاتية",
        caio: "CAIO",
        quality_scout: "كشاف الجودة",
        template_architect: "مساعد النماذج والتصميم",
      };

      const cleanPhone = clientPhone.replace(/[^0-9+]/g, "");
      const whatsappLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith("+") ? cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(`مرحباً ${clientName}، بخصوص طلبك رقم ${refId}...`)}` : "";

      const surveyBlock = survey_scores
        ? `\n\n⭐ <b>تقييم العميل:</b>\n` +
          `   سهولة الخدمة: ${"⭐".repeat(survey_scores.ease || 0)} (${survey_scores.ease || 0}/5)\n` +
          `   جودة المخرجات: ${"⭐".repeat(survey_scores.quality || 0)} (${survey_scores.quality || 0}/5)\n` +
          (survey_scores.needs ? `   احتياجات مستقبلية: ${survey_scores.needs}` : "")
        : "";

      let telegramMsg = "";
      if (isTemplateArchitect) {
        telegramMsg = `📐 <b>تقرير متطلبات تصميم نموذج جديد!</b>\n\n` +
          `🔖 الرقم المرجعي: <code>${refId}</code>\n` +
          `👤 العميل: ${clientName}\n` +
          (clientRole || visitor_role ? `🏷️ الدور: ${visitor_role || clientRole}\n` : "") +
          (clientPhone ? `📞 الجوال: ${clientPhone}\n` : "") +
          `\n📋 <b>التقرير:</b>\n${summary}` +
          surveyBlock +
          (whatsappLink ? `\n\n📱 <b>واتساب مباشر:</b> ${whatsappLink}` : "");
      } else {
        telegramMsg = `✅ <b>طلب خدمة/استشارة مكتمل!</b>\n\n` +
          `🔖 الرقم المرجعي: <code>${refId}</code>\n` +
          `🤖 الوكيل: ${agentLabels[agentType] || agentType}\n` +
          `👤 العميل: ${clientName}\n` +
          (clientRole || visitor_role ? `🏷️ الدور: ${visitor_role || clientRole}\n` : "") +
          (clientPhone ? `📞 الجوال: ${clientPhone}\n` : "") +
          `📝 الملخص: ${summary}` +
          surveyBlock +
          (whatsappLink ? `\n\n📱 واتساب مباشر: ${whatsappLink}` : "");
      }

      await sendTelegramAlert(supabase, telegramMsg);

      // ===== STANDARDIZED RESPONSE: If critical DB writes failed, return error =====
      if (errors.length > 0) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `فشل حفظ البيانات في: ${errors.join(", ")}`, 
          ref_id: refId, 
          summary 
        }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, ok: true, summary, ref_id: refId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== REGULAR CHAT ==========
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required", success: false }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (multimodal_content && Array.isArray(multimodal_content)) {
      const contentSize = estimateBase64Size(multimodal_content);
      if (contentSize > MAX_BASE64_SIZE) {
        return new Response(
          JSON.stringify({ error: "Payload too large. Maximum file size is 5MB.", success: false }),
          { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Server configuration error", success: false }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const agentType = agent || "career_twin";
    const promptSettingKey = `agent_prompt_${agentType}`;

    let systemPromptBase: string;
    switch (agentType) {
      case "legal_advisor": systemPromptBase = DEFAULT_LEGAL_ADVISOR_PROMPT; break;
      case "cv_assistant": systemPromptBase = DEFAULT_CV_ASSISTANT_PROMPT; break;
      case "caio": systemPromptBase = DEFAULT_CAIO_PROMPT; break;
      case "quality_scout": systemPromptBase = DEFAULT_QUALITY_SCOUT_PROMPT; break;
      case "template_architect": systemPromptBase = DEFAULT_TEMPLATE_ARCHITECT_PROMPT; break;
      default: systemPromptBase = DEFAULT_CAREER_TWIN_PROMPT;
    }

    const { data: customPromptSetting } = await supabase
      .from("admin_settings").select("setting_value").eq("setting_key", promptSettingKey).maybeSingle();

    if (customPromptSetting?.setting_value?.trim()) {
      systemPromptBase = customPromptSetting.setting_value;
    }

    const { data: modelSetting } = await supabase
      .from("admin_settings").select("setting_value").eq("setting_key", "active_model").maybeSingle();

    let activeModel = modelSetting?.setting_value || "google/gemini-3-flash-preview";
    if (multimodal_content && multimodal_content.length > 0) {
      activeModel = "google/gemini-2.5-flash";
    }

    const userMessage = messages[messages.length - 1]?.content || "";

    // === AGENT SANDBOXING: Inject strict scope boundaries ===
    const scopeBoundary = AGENT_SCOPE_BOUNDARIES[agentType];
    let sandboxingDirective = "";
    if (scopeBoundary) {
      sandboxingDirective = `

=== ⛔ حدود صارمة للوكيل (STRICT AGENT SCOPE BOUNDARY) ===
نطاقك المحدد: ${scopeBoundary.scope}
أي سؤال خارج هذا النطاق يجب أن تُجيب عليه بالرسالة التالية بالضبط:
"${scopeBoundary.rejectMessage}"
لا تحاول الإجابة على أسئلة خارج نطاقك أبداً. وجّه المستخدم للوكيل المختص عبر الروابط المذكورة.
=== نهاية حدود الوكيل ===`;
    }

    // === AGENT CONTEXT SANDBOXING ===
    let portfolioContext = "";
    let knowledgeContext = "";
    let dbSnapshot = "";
    let rlhfRulesContext = "";

    // RLHF: Fetch ONLY agent-specific golden rules (strict sandboxing)
    {
      const { data: agentRules } = await supabase
        .from("ai_knowledge_base")
        .select("question, answer")
        .eq("is_active", true)
        .eq("agent_target", agentType);

      if (agentRules && agentRules.length > 0) {
        rlhfRulesContext = `\n\n⚠️ قواعد حاسمة من تدريب المدير (CRITICAL RULES LEARNED FROM ADMIN - يجب تطبيقها بأولوية مطلقة):\n${agentRules.map((r, i) => `${i + 1}. السياق: ${r.question}\n   القاعدة: ${r.answer}`).join("\n\n")}`;
      }
    }

    if (agentType === "career_twin") {
      const { data: portfolioData } = await supabase
        .from("portfolio_content").select("content_key, content_ar, content_en, category").order("content_key");

      if (portfolioData && portfolioData.length > 0) {
        const cvLines = portfolioData.map((p) => `${p.content_key}: ${p.content_ar || ""} | ${p.content_en || ""}`).join("\n");
        portfolioContext = `\n\nبيانات السيرة الذاتية المحدّثة:\n${cvLines}`;
      }
    }

    // Knowledge base: ONLY for the specific agent (no cross-agent leaking)
    if (agentType === "career_twin" || agentType === "legal_advisor") {
      const { data: kbResults } = await supabase
        .from("ai_knowledge_base").select("answer, question, agent_target").eq("is_active", true);

      if (kbResults && kbResults.length > 0) {
        const userLower = userMessage.toLowerCase();
        // Only match rules for THIS agent or general rules (no agent_target)
        const matched = kbResults.filter(
          (kb) => (!kb.agent_target || kb.agent_target === agentType) &&
            (userLower.includes(kb.question.toLowerCase()) || kb.question.toLowerCase().includes(userLower))
        );
        if (matched.length > 0) {
          knowledgeContext = `\n\nمعلومات من قاعدة المعرفة:\n${matched.map((m) => `س: ${m.question}\nج: ${m.answer}`).join("\n\n")}`;
        }
      }
    }

    // CAIO: FRESH database snapshot
    if (agentType === "caio") {
      const [
        { count: jobCount },
        { count: companyCount },
        { count: consultCount },
        { count: leadCount },
        { count: chatCount },
        { count: orderCount },
        { count: templateCount },
        { count: contactCount },
        { count: kbCount },
        { count: portfolioCount },
        { count: notifCount },
        { count: adminSettingsCount },
        { count: caioSessionCount },
        { data: recentOrders },
        { data: topTemplates },
        { data: recentConsults },
        { data: recentJobApps },
        { data: recentLeads },
        { data: recentContacts },
      ] = await Promise.all([
        supabase.from("job_applications").select("*", { count: "exact", head: true }),
        supabase.from("company_requests").select("*", { count: "exact", head: true }),
        supabase.from("consultations").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("chat_logs").select("*", { count: "exact", head: true }),
        supabase.from("premium_orders").select("*", { count: "exact", head: true }),
        supabase.from("templates").select("*", { count: "exact", head: true }),
        supabase.from("contact_requests").select("*", { count: "exact", head: true }),
        supabase.from("ai_knowledge_base").select("*", { count: "exact", head: true }),
        supabase.from("portfolio_content").select("*", { count: "exact", head: true }),
        supabase.from("notification_settings").select("*", { count: "exact", head: true }),
        supabase.from("admin_settings").select("*", { count: "exact", head: true }),
        supabase.from("caio_sessions").select("*", { count: "exact", head: true }),
        supabase.from("premium_orders").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("templates").select("title, downloads_count, type, category").order("downloads_count", { ascending: false }).limit(10),
        supabase.from("consultations").select("issue_category, status, created_at, visitor_name").order("created_at", { ascending: false }).limit(10),
        supabase.from("job_applications").select("full_name, department, city, status, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("leads").select("name, phone, role, downloads_count, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("contact_requests").select("full_name, reason, status, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      const paidOrders = (recentOrders || []).filter((o: any) => o.status === "paid").length;
      const pendingOrders = (recentOrders || []).filter((o: any) => o.status === "pending").length;
      const categories = (recentConsults || []).reduce((acc: Record<string, number>, c: any) => { acc[c.issue_category] = (acc[c.issue_category] || 0) + 1; return acc; }, {});

      dbSnapshot = `\n\n=== لقطة بيانات المنصة الحية (تم جلبها الآن مباشرة من قاعدة البيانات) ===
⚠️ هذه أرقام حقيقية فعلية. إذا كان الرقم 0 فهو فارغ فعلاً. لا تفترض غير ذلك.

📊 الإحصائيات الإجمالية لجميع الجداول:
- طلبات التوظيف (job_applications): ${jobCount ?? 0}
- طلبات الشركات (company_requests): ${companyCount ?? 0}
- الاستشارات (consultations): ${consultCount ?? 0}
- العملاء المحتملون (leads): ${leadCount ?? 0}
- رسائل الدردشة (chat_logs): ${chatCount ?? 0}
- طلبات النماذج المميزة (premium_orders): ${orderCount ?? 0} (مدفوع: ${paidOrders}, معلق: ${pendingOrders})
- النماذج (templates): ${templateCount ?? 0}
- طلبات التواصل (contact_requests): ${contactCount ?? 0}
- قاعدة المعرفة (ai_knowledge_base): ${kbCount ?? 0}
- محتوى البورتفوليو (portfolio_content): ${portfolioCount ?? 0}
- إعدادات الإشعارات (notification_settings): ${notifCount ?? 0}
- إعدادات المدير (admin_settings): ${adminSettingsCount ?? 0}
- جلسات CAIO (caio_sessions): ${caioSessionCount ?? 0}

📈 أكثر النماذج تحميلاً:
${(topTemplates || []).length > 0 ? (topTemplates || []).map((t: any, i: number) => `${i + 1}. ${t.title} (${t.downloads_count} تحميل) - ${t.type === "premium" ? "مميز 💎" : "مجاني"}`).join("\n") : "فارغ - لا توجد نماذج"}

🏷️ فئات الاستشارات الأخيرة:
${Object.entries(categories).length > 0 ? Object.entries(categories).map(([k, v]) => `- ${k}: ${v}`).join("\n") : "فارغ - لا توجد استشارات"}

📋 آخر طلبات التوظيف:
${(recentJobApps || []).length > 0 ? (recentJobApps || []).slice(0, 5).map((j: any) => `- ${j.full_name} | ${j.department} | ${j.city} | ${j.status}`).join("\n") : "فارغ"}

💰 آخر الطلبات المميزة:
${(recentOrders || []).length > 0 ? (recentOrders || []).slice(0, 5).map((o: any) => `- ${o.customer_name} | ${o.template_name} | ${o.status}`).join("\n") : "فارغ"}

👥 آخر العملاء المحتملين:
${(recentLeads || []).length > 0 ? (recentLeads || []).slice(0, 5).map((l: any) => `- ${l.name} | ${l.phone} | ${l.role} | ${l.downloads_count} تحميل`).join("\n") : "فارغ"}

📩 آخر طلبات التواصل:
${(recentContacts || []).length > 0 ? (recentContacts || []).slice(0, 5).map((c: any) => `- ${c.full_name} | ${c.reason} | ${c.status}`).join("\n") : "فارغ"}
=== نهاية اللقطة ===`;
    }

    // Template Architect: inject templates list
    let templateContext = "";
    if (agentType === "template_architect") {
      const { data: templates } = await supabase
        .from("templates").select("title, description, category, type, gdrive_link").eq("is_active", true);

      if (templates && templates.length > 0) {
        templateContext = `\n\n=== النماذج المتوفرة في المتجر ===\n${templates.map((t: any) => `- ${t.title} (${t.category}) [${t.type === "premium" ? "مميز 💎" : "مجاني"}]${t.description ? ": " + t.description : ""}`).join("\n")}\n=== نهاية القائمة ===`;
      } else {
        templateContext = "\n\nلا توجد نماذج متوفرة حالياً في المتجر.";
      }
    }

    // Build system prompt WITH sandboxing directive
    const systemPrompt = systemPromptBase + sandboxingDirective + rlhfRulesContext + portfolioContext + knowledgeContext + dbSnapshot + templateContext;

    const aiMessages: any[] = [{ role: "system", content: systemPrompt }];

    // For CAIO sessions: fetch last 15 messages from DB
    if (agentType === "caio" && session_id) {
      const { data: sessionHistory } = await supabase
        .from("chat_logs").select("role, message").eq("session_id", session_id)
        .order("created_at", { ascending: true }).limit(15);

      if (sessionHistory && sessionHistory.length > 0) {
        for (const h of sessionHistory) {
          aiMessages.push({ role: h.role, content: h.message });
        }
      }

      const { data: sessionData } = await supabase
        .from("caio_sessions").select("status, title").eq("id", session_id).maybeSingle();

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
      agent_type: agentType,
    };
    if (session_id) logData.session_id = session_id;
    const { error: userLogError } = await supabase.from("chat_logs").insert(logData);
    if (userLogError) {
      console.error("WARNING: user chat_log insert failed:", userLogError);
    }

    // Call Lovable AI
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: activeModel, messages: aiMessages, stream: true }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later.", success: false }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required.", success: false }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error", success: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const isQualityScout = agentType === "quality_scout";

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
                agent_type: agentType,
              };
              if (session_id) assistantLog.session_id = session_id;
              const { error: assistantLogError } = await supabase.from("chat_logs").insert(assistantLog);
              if (assistantLogError) {
                console.error("WARNING: assistant chat_log insert failed:", assistantLogError);
              }

              if (isQualityScout) {
                const opportunityKeywords = ["تدقيق", "لوائح", "هيكلة", "استشارات", "منشأة", "شركة", "موظفين", "نعم"];
                const userLower = userMessage.toLowerCase();
                const hasOpportunity = opportunityKeywords.some(kw => userLower.includes(kw));

                if (hasOpportunity) {
                  await sendTelegramAlert(supabase,
                    `🔍 <b>فرصة تجارية من كشاف الجودة!</b>\n\n💬 رسالة العميل: "${userMessage}"\n🤖 رد الوكيل: "${fullResponse.slice(0, 200)}..."`
                  );
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
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
