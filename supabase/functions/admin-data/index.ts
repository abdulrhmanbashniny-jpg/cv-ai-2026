import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_TABLES = ["job_applications", "company_requests", "consultations", "chat_logs", "ai_knowledge_base", "admin_settings"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { table, action, data, id } = await req.json();

    if (table && !VALID_TABLES.includes(table)) {
      return new Response(JSON.stringify({ error: "Invalid table" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert
    if (action === "insert" && table && data) {
      const { error } = await supabase.from(table).insert(data);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update
    if (action === "update" && table && id && data) {
      const { error } = await supabase.from(table).update(data).eq("id", id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete
    if (action === "delete" && table && id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert settings
    if (action === "upsert_settings" && data) {
      for (const item of data) {
        await supabase
          .from("admin_settings")
          .upsert(item, { onConflict: "setting_key" });
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Test Telegram
    if (action === "test_telegram") {
      const { data: settings } = await supabase
        .from("admin_settings")
        .select("*")
        .in("setting_key", ["telegram_bot_token", "telegram_chat_id"]);

      const botToken = settings?.find((s: any) => s.setting_key === "telegram_bot_token")?.setting_value;
      const chatId = settings?.find((s: any) => s.setting_key === "telegram_chat_id")?.setting_value;

      if (!botToken || !chatId) {
        return new Response(JSON.stringify({ ok: false, error: "Telegram not configured" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");

      let telegramUrl: string;
      let telegramHeaders: Record<string, string>;

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
          text: "✅ <b>اختبار اتصال ناجح!</b>\n\nلوحة تحكم باشنيني متصلة بنجاح.",
          parse_mode: "HTML",
        }),
      });

      const result = await res.json();
      return new Response(JSON.stringify({ ok: res.ok, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Test AI
    if (action === "test_ai") {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ ok: false, error: "AI not configured" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{ role: "user", content: "Say OK" }],
            max_tokens: 10,
          }),
        });
        return new Response(JSON.stringify({ ok: res.ok, status: res.status }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: String(e) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get stats
    if (action === "stats") {
      const counts: Record<string, number> = {};
      for (const t of ["job_applications", "company_requests", "consultations", "ai_knowledge_base", "chat_logs"]) {
        const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
        counts[t] = count || 0;
      }
      return new Response(JSON.stringify({ ok: true, data: counts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: read
    if (table) {
      const { data: rows, error } = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      return new Response(JSON.stringify({ data: rows }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Missing params" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-data error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
