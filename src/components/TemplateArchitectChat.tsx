import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Paperclip, PhoneOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

type Msg = { role: "user" | "assistant"; content: string };

interface TemplateArchitectChatProps {
  userName?: string;
  userPhone?: string;
}

const TemplateArchitectChat = ({ userName, userPhone }: TemplateArchitectChatProps) => {
  const { t, lang } = useLanguage();
  const sessionId = useRef(`tpl-arch-${Date.now()}`).current;

  const DISCLAIMER: Msg = {
    role: "assistant",
    content: lang === "ar"
      ? "تنويه هام: هذا المساعد الذكي أداة استرشادية لتقديم معلومات عامة ولا يُغني عن الاستشارة المهنية المباشرة. استخدامك للدردشة يُعد موافقة صريحة وإخلاءً لمسؤولية المنصة.\n\nأهلاً بك! أنا مساعد النماذج والتصميم. كيف يمكنني مساعدتك في إيجاد أو تصميم النموذج الإداري المناسب لك؟"
      : "Important Notice: This AI assistant is a guidance tool providing general information. By using this chat, you agree to the platform's disclaimer.\n\nWelcome! I'm the Template & Design Architect. How can I help you find or design the right administrative template?",
  };

  const [messages, setMessages] = useState<Msg[]>([DISCLAIMER]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ending, setEnding] = useState(false);
  const [ended, setEnded] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMessages([{
      role: "assistant",
      content: lang === "ar"
        ? "تنويه هام: هذا المساعد الذكي أداة استرشادية لتقديم معلومات عامة ولا يُغني عن الاستشارة المهنية المباشرة. استخدامك للدردشة يُعد موافقة صريحة وإخلاءً لمسؤولية المنصة.\n\nأهلاً بك! أنا مساعد النماذج والتصميم. كيف يمكنني مساعدتك في إيجاد أو تصميم النموذج الإداري المناسب لك؟"
        : "Important Notice: This AI assistant is a guidance tool providing general information. By using this chat, you agree to the platform's disclaimer.\n\nWelcome! I'm the Template & Design Architect. How can I help you find or design the right administrative template?",
    }]);
  }, [lang]);

  const streamChat = async (allMessages: Msg[]) => {
    let assistantSoFar = "";
    const disclaimerContent = messages[0]?.content;
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
            messages: allMessages
              .filter((m) => m.content !== disclaimerContent)
              .map((m) => ({ role: m.role, content: m.content })),
            agent: "template_architect",
            session_id: sessionId,
            visitor_name: userName || undefined,
            visitor_phone: userPhone || undefined,
          }),
        }
      );

      if (!resp.ok) throw new Error("Connection failed");

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
                if (last?.role === "assistant" && last.content !== disclaimerContent) {
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
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || ended) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);
    await streamChat(allMessages);
  };

  const handleFileUpload = async (file: File) => {
    if (ended) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessages((prev) => [...prev, { role: "assistant", content: t("عذراً، حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت.", "Sorry, file too large. Max 10MB.") }]);
      return;
    }
    setUploadingFile(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `chat-uploads/${sessionId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("cv-uploads").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("cv-uploads").getPublicUrl(path);
      const userMsg: Msg = { role: "user", content: `${t("أرفقت ملف", "Attached file")}: ${file.name}\n${t("رابط الملف", "File link")}: ${urlData.publicUrl}` };
      const allMessages = [...messages, userMsg];
      setMessages(allMessages);
      setIsLoading(true);
      await streamChat(allMessages);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: t("عذراً، حدث خطأ أثناء رفع الملف.", "Sorry, error uploading file.") }]);
    } finally {
      setUploadingFile(false);
    }
  };

  const endConversation = async () => {
    if (messages.length < 3 || ending) return;
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
            messages: messages.filter((m, i) => i > 0),
            agent: "template_architect",
            visitor_name: userName || "زائر",
            visitor_phone: userPhone || "",
          }),
        }
      );
      const data = await resp.json();
      const refId = data.ref_id || "";
      setEnded(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: lang === "ar"
            ? `✅ تم إرسال تقرير متطلبات التصميم للأستاذ عبدالرحمن بنجاح! سيتم التواصل معك عبر الواتساب قريباً.\n\n🔖 **الرقم المرجعي:** ${refId}\n\n📝 **ملخص الطلب:**\n${data.summary || "تم الإرسال"}\n\nاحتفظ بالرقم المرجعي للمتابعة. شكراً لثقتك بنا! 🌟`
            : `✅ Design requirement report sent to Mr. Abdulrahman successfully! You'll be contacted via WhatsApp soon.\n\n🔖 **Reference ID:** ${refId}\n\n📝 **Request Summary:**\n${data.summary || "Sent"}\n\nKeep your reference ID for follow-up. Thank you for your trust! 🌟`,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("عذراً، حدث خطأ. حاول مرة أخرى.", "Sorry, an error occurred.") },
      ]);
    } finally {
      setEnding(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <span className="font-arabic font-semibold text-sm">
            {t("مساعد النماذج والتصميم", "Template & Design Architect")}
          </span>
        </div>
        <Bot className="h-5 w-5 opacity-70" />
      </div>

      {/* Messages */}
      <ScrollArea className="h-[360px] p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "assistant" ? "bg-primary/20 text-primary" : "bg-secondary text-foreground"}`}>
                {msg.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              </div>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm font-arabic leading-relaxed ${msg.role === "assistant" ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"}`}>
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="bg-secondary rounded-xl px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t border-border space-y-2">
        {messages.length >= 4 && !ended && (
          <Button
            onClick={endConversation}
            disabled={ending || isLoading}
            variant="outline"
            size="sm"
            className="w-full font-arabic text-xs gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            {ending ? <Loader2 className="h-3 w-3 animate-spin" /> : <PhoneOff className="h-3 w-3" />}
            {t("إنهاء المحادثة وإرسال التقرير", "End Conversation & Send Report")}
          </Button>
        )}
        {!ended ? (
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2" dir={lang === "ar" ? "rtl" : "ltr"}>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); e.target.value = ""; }} />
            <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isLoading || uploadingFile} className="text-muted-foreground hover:text-primary shrink-0">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("اكتب طلبك هنا... مثال: أحتاج نموذج إنذار موظف", "Type your request... e.g. I need an employee warning template")} className="flex-1 text-sm font-arabic" disabled={isLoading} />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-primary text-primary-foreground">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <p className="text-center text-xs text-muted-foreground font-arabic py-2">
            {t("تم إنهاء المحادثة. شكراً لك!", "Conversation ended. Thank you!")}
          </p>
        )}
      </div>
    </div>
  );
};

export default TemplateArchitectChat;
