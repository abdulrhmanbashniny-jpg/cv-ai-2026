import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `أنت عبدالرحمن باشنيني، مدير أول الموارد البشرية والشؤون القانونية بخبرة تفوق 15 عامًا. أنت خبير في نظام العمل السعودي واللوائح ذات العلاقة.

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
- لا تختلق معلومات قانونية`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, consultation_id } = await req.json();

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

    // Get the latest user message
    const userMessage = messages[messages.length - 1]?.content || "";

    // Check knowledge base first
    const { data: kbResults } = await supabase
      .from("ai_knowledge_base")
      .select("answer, question")
      .eq("is_active", true);

    let knowledgeContext = "";
    if (kbResults && kbResults.length > 0) {
      // Simple keyword matching
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

    const systemPrompt = SYSTEM_PROMPT + knowledgeContext;

    // Save user message to chat_logs
    await supabase.from("chat_logs").insert({
      role: "user",
      message: userMessage,
      consultation_id: consultation_id || null,
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
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
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

    // We need to capture the full response to save to chat_logs
    // Use a TransformStream to intercept and collect the response
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Save assistant response to chat_logs
            if (fullResponse) {
              await supabase.from("chat_logs").insert({
                role: "assistant",
                message: fullResponse,
                consultation_id: consultation_id || null,
              });
            }
            controller.close();
            break;
          }
          controller.enqueue(value);

          // Parse SSE to collect full text
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
