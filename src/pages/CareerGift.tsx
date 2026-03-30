import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Gift, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CareerGift = () => {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: `مرحباً! 🎁 أنا مساعد كتابة السيرة الذاتية من فريق الأستاذ عبدالرحمن باشنيني.\n\nسأساعدك في بناء سيرة ذاتية احترافية بمعايير الموارد البشرية — مجاناً تماماً!\n\nلنبدأ: **ما هو اسمك الكامل والمسمى الوظيفي الذي تستهدفه؟**`,
    },
  ]);
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
            messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
            agent: "cv_assistant",
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
                if (last?.role === "assistant" && prev.length > 1) {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { /* partial */ }
        }
      }
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen">
      <Navbar />
      <section className="pt-24 pb-16 min-h-screen bg-navy-gradient">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-full border border-primary/30 bg-primary/5">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-primary font-arabic text-sm">هدية مجانية</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-arabic text-foreground mb-2">
              مساعد كتابة <span className="text-gradient-gold">السيرة الذاتية</span>
            </h1>
            <p className="text-muted-foreground font-arabic">
              دع الذكاء الاصطناعي يساعدك في بناء CV احترافي بمعايير HR
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col" style={{ height: "65vh" }}>
            <div className="bg-secondary/50 px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <span className="font-arabic text-sm text-foreground font-medium">مساعد CV المجاني</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-primary/20" : "bg-secondary"}`}>
                    {msg.role === "assistant" ? <Bot className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-foreground" />}
                  </div>
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.role === "user" ? "bg-primary/20 text-foreground" : "bg-secondary text-foreground"}`}>
                    <div className="font-arabic text-sm prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-secondary rounded-xl px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-border flex gap-2">
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-primary text-primary-foreground shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="اكتب معلوماتك هنا..."
                className="text-right font-arabic"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default CareerGift;
