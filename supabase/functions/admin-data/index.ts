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

    // Test Google Drive
    if (action === "test_drive") {
      const { json_credentials, folder_id } = data || {};

      // Validate JSON format
      let creds: any;
      try {
        creds = typeof json_credentials === "string" ? JSON.parse(json_credentials) : json_credentials;
        if (!creds.client_email || !creds.private_key || !creds.token_uri) {
          return new Response(JSON.stringify({ ok: false, error: "Invalid JSON: missing client_email, private_key, or token_uri" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch {
        return new Response(JSON.stringify({ ok: false, error: "Invalid JSON format" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!folder_id) {
        return new Response(JSON.stringify({ ok: false, error: "Folder ID is required" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      try {
        // Build JWT for Google API
        const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
        const now = Math.floor(Date.now() / 1000);
        const claimSet = btoa(JSON.stringify({
          iss: creds.client_email,
          scope: "https://www.googleapis.com/auth/drive.file",
          aud: creds.token_uri,
          exp: now + 3600,
          iat: now,
        }));

        // Import private key and sign JWT
        const pemContent = creds.private_key.replace(/-----BEGIN PRIVATE KEY-----/g, "").replace(/-----END PRIVATE KEY-----/g, "").replace(/\s/g, "");
        const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
        const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
        const signatureInput = new TextEncoder().encode(`${header}.${claimSet}`);
        const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, signatureInput);
        const encodedSig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const jwt = `${header}.${claimSet}.${encodedSig}`;

        // Exchange JWT for access token
        const tokenRes = await fetch(creds.token_uri, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
          return new Response(JSON.stringify({ ok: false, error: "Authentication failed: " + (tokenData.error_description || "Invalid credentials") }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const accessToken = tokenData.access_token;

        // Check folder access
        const folderRes = await fetch(`https://www.googleapis.com/drive/v3/files/${folder_id}?fields=id,name`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!folderRes.ok) {
          const errBody = await folderRes.json().catch(() => ({}));
          const reason = folderRes.status === 404
            ? `Folder not found — please share the folder with ${creds.client_email}`
            : `Permission denied — please share the folder with ${creds.client_email}`;
          return new Response(JSON.stringify({ ok: false, error: reason }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Write test file
        const boundary = "---lovable_test_boundary";
        const metadata = JSON.stringify({ name: "connection_test.txt", parents: [folder_id] });
        const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: text/plain\r\n\r\nLovable Drive connection test\r\n--${boundary}--`;

        const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}` },
          body,
        });

        if (!uploadRes.ok) {
          return new Response(JSON.stringify({ ok: false, error: `Write failed — please ensure the folder is shared with ${creds.client_email} as Editor` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const uploadData = await uploadRes.json();

        // Delete test file
        await fetch(`https://www.googleapis.com/drive/v3/files/${uploadData.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        return new Response(JSON.stringify({ ok: true, service_account: creds.client_email }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown error during Drive test" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
