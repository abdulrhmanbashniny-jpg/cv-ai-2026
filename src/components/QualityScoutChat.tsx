import { useState, useRef, useEffect } from "react";
import { Star, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "@/contexts/LanguageContext";

type Msg = { role: "user" | "assistant"; content: string };

interface QualityScoutChatProps {
  serviceName: string;
  onClose: () => void;
}

const QualityScoutChat = ({ serviceName, onClose }: QualityScoutChatProps) => {
  const { t, lang } = useLanguage();

  const greeting: Msg = {
    role: "assistant",
    content: lang === "ar"
      ? `شكراً لاستخدامك خدمة "${serviceName}"! 🎉\n\nأنا مدير نجاح العملاء في منصة الأستاذ عبدالرحمن سالم باشنيني. أود سماع رأيك حول تجربتك. كيف تقيّم الخدمة التي حصلت عليها؟`
      : `Thank you for using "${serviceName}"! 🎉\n\nI'm the Customer Success Manager at Abdulrahman Bashniny's platform. I'd love to hear your feedback. How would you rate the service you received?`,
  };

  const [messages, setMessages] = useState<Msg[]>([greeting]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const streamChat = async (allMessages: Msg[]) => {
    let assistantSoFar = "";
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
            messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
            agent: "quality_scout",
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
                if (last?.role === "assistant" && last !== greeting) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { /* partial */ }
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: t("عذراً، حدث خطأ.", "Sorry, an error occurred.") }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);
    await streamChat(allMessages);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[480px] max-h-[calc(100vh-4rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-rose-500 to-amber-500 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          <span className="font-arabic font-semibold text-sm">{t("كشاف الجودة والنمو", "Quality & Growth Scout")}</span>
        </div>
        <button onClick={onClose} className="hover:opacity-80">
          <X className="h-5 w-5" />
        </button>
      </div>

      <ScrollArea className="flex-1 p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "assistant" ? "bg-rose-500/20 text-rose-500" : "bg-secondary text-foreground"}`}>
                {msg.role === "assistant" ? <Star className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              </div>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm font-arabic leading-relaxed ${msg.role === "assistant" ? "bg-secondary text-foreground" : "bg-rose-500 text-white"}`}>
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center">
                <Star className="h-3.5 w-3.5" />
              </div>
              <div className="bg-secondary rounded-xl px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2" dir={lang === "ar" ? "rtl" : "ltr"}>
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("اكتب رأيك...", "Share your feedback...")} className="flex-1 text-sm font-arabic" disabled={isLoading} />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-rose-500 text-white hover:bg-rose-600">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default QualityScoutChat;
