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
    const { type, data } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get settings from admin_settings table
    const { data: settings } = await supabase
      .from("admin_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["telegram_bot_token", "telegram_chat_id"]);

    const botToken = settings?.find((s: any) => s.setting_key === "telegram_bot_token")?.setting_value;
    const chatId = settings?.find((s: any) => s.setting_key === "telegram_chat_id")?.setting_value;

    if (!botToken || !chatId) {
      return new Response(
        JSON.stringify({ error: "Telegram not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let message = "";
    const typeLabel = type === "job_application" ? "طلب توظيف" : type === "company_request" ? "طلب شركة" : type === "consultation" ? "استشارة" : type;

    if (type === "job_application") {
      message = `🚀 <b>عميل محتمل جديد!</b>\n\n` +
        `📋 النوع: طلب توظيف\n` +
        `👤 الاسم: ${data.full_name}\n` +
        `📞 الجوال: ${data.phone}\n` +
        `🏙️ المدينة: ${data.city}\n` +
        `🏢 القسم: ${data.department}\n` +
        `🔢 المرجع: ${data.reference_number}\n\n` +
        `📌 عرض التفاصيل في لوحة التحكم`;
    } else if (type === "company_request") {
      message = `🚀 <b>عميل محتمل جديد!</b>\n\n` +
        `📋 النوع: طلب شركة\n` +
        `🏭 الشركة: ${data.company_name}\n` +
        `👤 المسؤول: ${data.contact_person}\n` +
        `📧 البريد: ${data.contact_email}\n` +
        `📞 الجوال: ${data.contact_phone}\n` +
        `💼 الاحتياجات: ${data.hiring_needs}\n` +
        `🔢 المرجع: ${data.reference_number}\n\n` +
        `📌 عرض التفاصيل في لوحة التحكم`;
    } else if (type === "consultation") {
      message = `🚀 <b>عميل محتمل جديد!</b>\n\n` +
        `📋 النوع: استشارة\n` +
        `👤 الاسم: ${data.visitor_name || "زائر"}\n` +
        `📂 الفئة: ${data.issue_category}\n` +
        `🔢 المرجع: ${data.reference_number}\n` +
        `📝 الملخص: ${data.summary || "بدون ملخص"}` +
        (data.needs_human_review ? "\n\n⚠️ <b>يحتاج مراجعة بشرية</b>" : "") +
        `\n\n📌 عرض التفاصيل في لوحة التحكم`;
    }

    if (message) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      let telegramUrl: string;
      let telegramHeaders: Record<string, string>;

      const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
      if (LOVABLE_API_KEY && TELEGRAM_API_KEY) {
        telegramUrl = "https://connector-gateway.lovable.dev/telegram/sendMessage";
        telegramHeaders = {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TELEGRAM_API_KEY,
          "Content-Type": "application/json",
        };
      } else {
        telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        telegramHeaders = { "Content-Type": "application/json" };
      }

      const res = await fetch(telegramUrl, {
        method: "POST",
        headers: telegramHeaders,
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      });

      const result = await res.json();
      return new Response(JSON.stringify({ ok: true, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Telegram notify error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
