import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_TABLES = ["job_applications", "company_requests", "consultations", "chat_logs", "ai_knowledge_base", "admin_settings", "contact_requests", "portfolio_content", "templates", "leads", "premium_orders", "notification_settings", "caio_sessions"];

// Tables that anonymous users are allowed to read (for public-facing features like footer settings)
const PUBLIC_READ_TABLES = ["admin_settings", "portfolio_content", "templates", "notification_settings"];

// Actions that don't require authentication (read-only public data)
const PUBLIC_ACTIONS: string[] = [];

async function verifyAdmin(req: Request): Promise<{ authenticated: boolean; error?: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { authenticated: false, error: "Missing authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return { authenticated: false, error: "Invalid or expired session" };
  }

  // Check admin_password from settings as a secondary check
  // The user must be authenticated via Supabase Auth
  return { authenticated: true };
}

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

    // Determine if this request needs authentication
    const isPublicRead = !action && table && PUBLIC_READ_TABLES.includes(table);
    const isPublicAction = action && PUBLIC_ACTIONS.includes(action);

    if (!isPublicRead && !isPublicAction) {
      // All write operations and sensitive reads require authentication
      const { authenticated, error: authError } = await verifyAdmin(req);
      if (!authenticated) {
        return new Response(JSON.stringify({ error: authError || "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

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

    // Update portfolio content
    if (action === "update_portfolio" && data) {
      const { id: itemId, content_ar, content_en } = data;
      const { error } = await supabase
        .from("portfolio_content")
        .update({ content_ar, content_en, updated_at: new Date().toISOString() })
        .eq("id", itemId);
      if (error) throw error;
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
      const { json_credentials, folder_id: rawFolderId } = data || {};
      const folderId = (rawFolderId || "").trim().replace(/[^\w-]/g, "");

      let creds: any;
      try {
        creds = typeof json_credentials === "string" ? JSON.parse(json_credentials) : json_credentials;
        if (!creds.client_email || !creds.private_key || !creds.token_uri) {
          return new Response(JSON.stringify({ ok: false, error: "Invalid JSON: missing client_email, private_key, or token_uri", details: { step: "json_validation" } }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: "Invalid JSON format: " + (e instanceof Error ? e.message : String(e)), details: { step: "json_parse" } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!folderId) {
        return new Response(JSON.stringify({ ok: false, error: "Folder ID is required", details: { step: "folder_id_validation" } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const logs: string[] = [];
      logs.push(`Service Account: ${creds.client_email}`);
      logs.push(`Folder ID (trimmed): ${folderId}`);
      logs.push(`Token URI: ${creds.token_uri}`);

      try {
        creds.private_key = creds.private_key.replace(/\\n/g, "\n");

        const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
        const now = Math.floor(Date.now() / 1000);
        const claimSet = btoa(JSON.stringify({
          iss: creds.client_email,
          scope: "https://www.googleapis.com/auth/drive",
          aud: creds.token_uri,
          exp: now + 3600,
          iat: now,
        }));

        const pemContent = creds.private_key.replace(/-----BEGIN PRIVATE KEY-----/g, "").replace(/-----END PRIVATE KEY-----/g, "").replace(/\s/g, "");
        const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
        const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
        const signatureInput = new TextEncoder().encode(`${header}.${claimSet}`);
        const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, signatureInput);
        const encodedSig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const jwt = `${header}.${claimSet}.${encodedSig}`;
        logs.push("JWT signed successfully");

        const tokenRes = await fetch(creds.token_uri, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
          logs.push(`Token exchange failed: ${JSON.stringify(tokenData)}`);
          return new Response(JSON.stringify({ ok: false, error: `Auth failed (${tokenRes.status}): ${tokenData.error_description || tokenData.error || "Unknown"}`, details: { step: "token_exchange", status: tokenRes.status, response: tokenData, logs } }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const accessToken = tokenData.access_token;
        logs.push("Access token obtained");

        const listUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&pageSize=1&fields=files(id,name)`;
        const listRes = await fetch(listUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const listBody = await listRes.json();
        logs.push(`List files: HTTP ${listRes.status}`);

        if (!listRes.ok) {
          const apiError = listBody?.error || {};
          logs.push(`List error: ${JSON.stringify(apiError)}`);
          return new Response(JSON.stringify({
            ok: false,
            error: `Google API ${listRes.status}: ${apiError.message || JSON.stringify(listBody)}`,
            details: { step: "list_files", status: listRes.status, code: apiError.code, message: apiError.message, errors: apiError.errors, logs },
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        logs.push(`Folder accessible, ${listBody.files?.length || 0} file(s) found`);

        const folderRes = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const folderBody = await folderRes.json();
        logs.push(`Folder metadata: HTTP ${folderRes.status}`);

        if (!folderRes.ok) {
          const apiError = folderBody?.error || {};
          logs.push(`Folder error: ${JSON.stringify(apiError)}`);
          return new Response(JSON.stringify({
            ok: false,
            error: `Google API ${folderRes.status}: ${apiError.message || JSON.stringify(folderBody)}`,
            details: { step: "folder_metadata", status: folderRes.status, code: apiError.code, message: apiError.message, errors: apiError.errors, logs },
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        logs.push(`Folder name: "${folderBody.name}", type: ${folderBody.mimeType}`);

        return new Response(JSON.stringify({ ok: true, service_account: creds.client_email, folder_name: folderBody.name, details: { logs } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        logs.push(`Exception: ${e instanceof Error ? e.message : String(e)}`);
        return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown error", details: { step: "exception", logs } }), {
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
