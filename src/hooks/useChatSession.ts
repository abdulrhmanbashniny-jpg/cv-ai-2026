import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export type Msg = { role: "user" | "assistant"; content: string };

export type AgentType = "career_twin" | "legal_advisor" | "cv_assistant" | "caio" | "quality_scout" | "template_architect";

export interface VisitorData {
  name: string;
  phone: string;
  role: string;
  sessionId: string;
}

export interface SurveyScores {
  ease: number;
  quality: number;
  needs: string;
}

export interface EndConversationResult {
  refId: string;
  summary: string;
}

interface UseChatSessionOptions {
  agentType: AgentType;
  disclaimerAr: string;
  disclaimerEn: string;
  greetingFn?: (name: string, lang: string) => string;
  lang: string;
}

export function useChatSession({ agentType, disclaimerAr, disclaimerEn, greetingFn, lang }: UseChatSessionOptions) {
  const [visitor, setVisitor] = useState<VisitorData | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [ending, setEnding] = useState(false);
  const [ended, setEnded] = useState(false);
  const [endResult, setEndResult] = useState<EndConversationResult | null>(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const disclaimer = lang === "ar" ? disclaimerAr : disclaimerEn;

  const t = useCallback((ar: string, en: string) => lang === "ar" ? ar : en, [lang]);

  // Initialize session after PreChatForm submission
  const initSession = useCallback((data: { name: string; phone: string; role?: string; sessionId?: string }) => {
    const sessionId = data.sessionId || uuidv4();
    const visitorData: VisitorData = {
      name: data.name,
      phone: data.phone,
      role: data.role || "موظف",
      sessionId,
    };
    setVisitor(visitorData);

    const greeting = greetingFn
      ? greetingFn(data.name, lang)
      : (lang === "ar" ? `مرحباً ${data.name}! كيف يمكنني مساعدتك اليوم؟` : `Hello ${data.name}! How can I help you today?`);

    setMessages([
      { role: "assistant", content: disclaimer },
      { role: "assistant", content: greeting },
    ]);
  }, [disclaimer, greetingFn, lang]);

  // Reset messages on language change (before session starts)
  const resetDisclaimer = useCallback(() => {
    if (!visitor) {
      setMessages([{ role: "assistant", content: disclaimer }]);
    }
  }, [visitor, disclaimer]);

  // Stream chat to edge function
  const streamChat = useCallback(async (allMessages: Msg[], multimodalContent?: any[]) => {
    if (!visitor) return;
    let assistantSoFar = "";
    try {
      const body: any = {
        messages: allMessages
          .filter((m) => m.content !== disclaimer)
          .map((m) => ({ role: m.role, content: m.content })),
        agent: agentType,
        session_id: visitor.sessionId,
        visitor_name: visitor.name,
        visitor_phone: visitor.phone,
      };
      if (multimodalContent) body.multimodal_content = multimodalContent;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Connection failed");
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last.content !== disclaimer) {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { /* partial JSON */ }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("عذراً، حدث خطأ. حاول مرة أخرى.", "Sorry, an error occurred. Please try again.") },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [visitor, agentType, disclaimer, t]);

  // Send a text message
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || !visitor || ended) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);
    await streamChat(allMessages);
  }, [input, isLoading, visitor, ended, messages, streamChat]);

  // Upload file
  const handleFileUpload = useCallback(async (file: File) => {
    if (!visitor || ended) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessages((prev) => [...prev, { role: "assistant", content: t("عذراً، حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت.", "Sorry, file too large. Max 10MB.") }]);
      return;
    }

    setUploadingFile(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `chat-uploads/${visitor.sessionId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("cv-uploads").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("cv-uploads").getPublicUrl(path);

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          const userMsg: Msg = { role: "user", content: `[${t("مرفق", "Attachment")}: ${file.name}]` };
          const allMessages = [...messages, userMsg];
          setMessages(allMessages);
          setIsLoading(true);
          await streamChat(allMessages, [
            { type: "image_url", image_url: { url: base64 } },
            { type: "text", text: `User attached image "${file.name}". Analyze it and respond.` },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        const userMsg: Msg = { role: "user", content: `${t("أرفقت ملف", "Attached file")}: ${file.name}\n${t("رابط الملف", "File link")}: ${urlData.publicUrl}` };
        const allMessages = [...messages, userMsg];
        setMessages(allMessages);
        setIsLoading(true);
        await streamChat(allMessages);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: t("عذراً، حدث خطأ أثناء رفع الملف.", "Sorry, error uploading file.") }]);
    } finally {
      setUploadingFile(false);
    }
  }, [visitor, ended, messages, streamChat, t]);

  // End conversation — triggers survey modal
  const endConversation = useCallback(async (surveyScores?: SurveyScores) => {
    if (!visitor || messages.length < 3 || ending) return;
    setEnding(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: "end_conversation",
            messages: messages.filter((m) => m.content !== disclaimer),
            agent: agentType,
            visitor_name: visitor.name,
            visitor_phone: visitor.phone,
            visitor_role: visitor.role,
            survey_scores: surveyScores || undefined,
          }),
        }
      );
      const data = await resp.json();
      const refId = data.ref_id || "";
      const summary = data.summary || "";
      setEndResult({ refId, summary });
      setEnded(true);
      setShowSurvey(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: lang === "ar"
            ? `✅ تم إنهاء المحادثة وإرسال ملخصها للأستاذ عبدالرحمن بنجاح!\n\n🔖 **الرقم المرجعي:** ${refId}\n\n📝 **الملخص:**\n${summary}\n\nاحتفظ بالرقم المرجعي للمتابعة. شكراً لثقتك بنا! 🌟`
            : `✅ Conversation ended and summary sent successfully!\n\n🔖 **Reference ID:** ${refId}\n\n📝 **Summary:**\n${summary}\n\nKeep your reference ID for follow-up. Thank you! 🌟`,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("عذراً، حدث خطأ أثناء إنهاء المحادثة.", "Sorry, error ending conversation.") },
      ]);
    } finally {
      setEnding(false);
    }
  }, [visitor, messages, ending, agentType, disclaimer, lang, t]);

  // Trigger the survey flow (called when user clicks "End Conversation")
  const triggerEndFlow = useCallback(() => {
    if (messages.length < 3 || ending || ended) return;
    setShowSurvey(true);
  }, [messages.length, ending, ended]);

  // Submit survey and then end
  const submitSurveyAndEnd = useCallback(async (scores: SurveyScores) => {
    await endConversation(scores);
  }, [endConversation]);

  // Skip survey and end directly
  const skipSurveyAndEnd = useCallback(async () => {
    await endConversation();
  }, [endConversation]);

  return {
    visitor,
    messages,
    setMessages,
    input,
    setInput,
    isLoading,
    uploadingFile,
    ending,
    ended,
    endResult,
    showSurvey,
    setShowSurvey,
    chatEndRef,
    fileInputRef,
    initSession,
    resetDisclaimer,
    sendMessage,
    handleFileUpload,
    triggerEndFlow,
    submitSurveyAndEnd,
    skipSurveyAndEnd,
    t,
  };
}
