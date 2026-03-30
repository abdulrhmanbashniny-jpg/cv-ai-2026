import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const DISCLAIMER: Msg = {
  role: "assistant",
  content:
    "تنويه هام: هذا المساعد الذكي أداة استرشادية لتقديم معلومات عامة ولا يُغني عن الاستشارة المهنية أو القانونية المباشرة. استخدامك للدردشة يُعد موافقة صريحة وإخلاءً لمسؤولية المنصة. أهلاً بك! أنا المساعد الذكي للأستاذ عبدالرحمن بشنيني. اسألني عن خبراته المهنية، أو دعني أرشدك لخدماتنا المجانية (بناء السيرة الذاتية والاستشارات).",
};

const FloatingAIChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([DISCLAIMER]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

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
            messages: allMessages
              .filter((m) => m !== DISCLAIMER)
              .map((m) => ({ role: m.role, content: m.content })),
            agent: "career_twin",
          }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "فشل الاتصال");
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
                if (last?.role === "assistant" && last !== DISCLAIMER) {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            /* partial JSON */
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "عذراً، حدث خطأ. حاول مرة أخرى." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Expose open method globally
  useEffect(() => {
    (window as any).__openFloatingChat = () => setOpen(true);
    return () => { delete (window as any).__openFloatingChat; };
  }, []);

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform flex items-center justify-center glow-gold"
          aria-label="فتح المحادثة"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 left-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-4rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-arabic font-semibold text-sm">المساعد الذكي</span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-80">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" dir="rtl">
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === "assistant"
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm font-arabic leading-relaxed ${
                      msg.role === "assistant"
                        ? "bg-secondary text-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                      {msg.content}
                    </ReactMarkdown>
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

          {/* Input */}
          <div className="p-3 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
              dir="rtl"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب رسالتك..."
                className="flex-1 text-sm font-arabic"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="bg-primary text-primary-foreground"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAIChat;
