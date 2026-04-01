import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template_id, name, email, phone, role } = await req.json();

    if (!template_id || !name?.trim() || !email?.trim() || !phone?.trim() || !role?.trim()) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const phoneRegex = /^9665[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return new Response(JSON.stringify({ error: "Invalid Saudi phone number" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get template
    const { data: template, error: templateErr } = await supabase
      .from("templates").select("*").eq("id", template_id).eq("is_active", true).single();

    if (templateErr || !template) {
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert lead
    const { data: existingLead } = await supabase.from("leads").select("*").eq("phone", phone).maybeSingle();
    let leadDownloadsCount = 1;

    if (existingLead) {
      const downloadedTemplates = existingLead.downloaded_templates || [];
      if (!downloadedTemplates.includes(template_id)) downloadedTemplates.push(template_id);
      leadDownloadsCount = downloadedTemplates.length;
      await supabase.from("leads").update({ name, email, role, downloaded_templates: downloadedTemplates, downloads_count: leadDownloadsCount }).eq("id", existingLead.id);
    } else {
      await supabase.from("leads").insert({ name, email, phone, role, downloaded_templates: [template_id], downloads_count: 1 });
    }

    // Increment template download count
    await supabase.from("templates").update({ downloads_count: (template.downloads_count || 0) + 1 }).eq("id", template_id);

    // Helper: send Telegram message
    const sendTelegram = async (msg: string) => {
      try {
        const { data: settings } = await supabase
          .from("admin_settings").select("setting_key, setting_value")
          .in("setting_key", ["telegram_bot_token", "telegram_chat_id"]);

        const botToken = settings?.find((s: any) => s.setting_key === "telegram_bot_token")?.setting_value;
        const chatId = settings?.find((s: any) => s.setting_key === "telegram_chat_id")?.setting_value;
        if (!botToken || !chatId) return;

        // Check notification settings
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");

        let telegramUrl: string;
        let telegramHeaders: Record<string, string>;

        if (LOVABLE_API_KEY && TELEGRAM_API_KEY) {
          telegramUrl = "https://connector-gateway.lovable.dev/telegram/sendMessage";
          telegramHeaders = { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": TELEGRAM_API_KEY, "Content-Type": "application/json" };
        } else {
          telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
          telegramHeaders = { "Content-Type": "application/json" };
        }

        await fetch(telegramUrl, {
          method: "POST", headers: telegramHeaders,
          body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "HTML" }),
        });
      } catch (e) { console.error("Telegram error:", e); }
    };

    // Hot Lead Radar: if > 3 downloads
    if (leadDownloadsCount > 3) {
      await sendTelegram(`🚨 <b>صيد ثمين!</b>\n\n👤 ${name} - ${role}\n📞 ${phone}\n📧 ${email}\n📥 قام بتحميل ${leadDownloadsCount} نماذج.\n\n✅ يُنصح بالتواصل معه!`);
    }

    // For FREE templates
    if (template.type === "free") {
      // Send download notification
      await sendTelegram(`📥 <b>تحميل نموذج مجاني</b>\n\n👤 ${name}\n📞 ${phone}\n📧 ${email}\n📄 ${template.title}`);

      return new Response(JSON.stringify({
        ok: true, type: "free", download_url: template.gdrive_link, template_title: template.title,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // For PREMIUM templates
    // 1. Create premium order
    const leadId = existingLead?.id || null;
    await supabase.from("premium_orders").insert({
      template_id, lead_id: leadId, template_name: template.title,
      customer_name: name, customer_phone: phone, customer_email: email,
    });

    // 2. Send Telegram alert with WhatsApp action link
    const whatsappDeliveryMsg = encodeURIComponent(
      `أهلاً بك أستاذ ${name}، معك عبدالرحمن بشنيني صاحب منصة الخدمات الإدارية للموارد البشرية. بخصوص طلبك لنموذج "${template.title}"، يسعدني تزويدك بالتفاصيل...`
    );
    const whatsappLink = `https://wa.me/${phone}?text=${whatsappDeliveryMsg}`;

    await sendTelegram(
      `📦 <b>طلب نموذج مميز جديد!</b>\n\n👤 الاسم: ${name}\n📞 الجوال: ${phone}\n📧 البريد: ${email}\n📄 المنتج: ${template.title}\n\n<a href="${whatsappLink}">💬 فتح واتساب للتواصل</a>`
    );

    return new Response(JSON.stringify({
      ok: true, type: "premium", template_title: template.title,
      message: "تم رفع طلبك بنجاح، سيقوم الأستاذ عبدالرحمن بالتواصل معك لتسليم الملفات",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("template-download error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
