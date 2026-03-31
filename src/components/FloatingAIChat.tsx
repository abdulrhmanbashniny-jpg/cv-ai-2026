import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import PreChatForm from "@/components/PreChatForm";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

const DISCLAIMER: Msg = {
  role: "assistant",
  content:
    "تنويه هام: هذا المساعد الذكي أداة استرشادية لتقديم معلومات عامة ولا يُغني عن الاستشارة المهنية أو القانونية المباشرة. استخدامك للدردشة يُعد موافقة صريحة وإخلاءً لمسؤولية المنصة. أهلاً بك! أنا المساعد الذكي للأستاذ عبدالرحمن بشنيني. اسألني عن خبراته المهنية، أو دعني أرشدك لخدماتنا المجانية (بناء السيرة الذاتية والاستشارات).",
};

const FloatingAIChat = () => {
  const [open, setOpen] = useState(false);
  const [sessionData, setSessionData] = useState<{ name: string; phone: string; sessionId: string } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([DISCLAIMER]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePreChat = (data: { name: string; phone: string; sessionId: string }) => {
    setSessionData(data);
    setMessages([
      DISCLAIMER,
      { role: "assistant", content: `مرحباً ${data.name}! كيف يمكنني مساعدتك اليوم؟` },
    ]);
  };

  const handleFileUpload = async (file: File) => {
    if (!sessionData) return;
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setMessages((prev) => [...prev, { role: "assistant", content: "عذراً، حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت." }]);
      return;
    }

    setUploadingFile(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `chat-uploads/${sessionData.sessionId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("cv-uploads").upload(path, file);
      if (error) throw error;

      const { data: urlData } = supabase.storage.from("cv-uploads").getPublicUrl(path);

      // For images, send as vision content
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          const userMsg: Msg = { role: "user", content: `[مرفق: ${file.name}]` };
          const allMessages = [...messages, userMsg];
          setMessages(allMessages);
          setIsLoading(true);

          await streamChat(allMessages, sessionData.sessionId, [
            {
              type: "image_url",
              image_url: { url: base64 },
            },
            { type: "text", text: `المستخدم أرفق صورة باسم "${file.name}". حلل محتواها وأجب عن أي أسئلة.` },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        // For PDFs/docs, mention the upload
        const userMsg: Msg = { role: "user", content: `أرفقت ملف: ${file.name}\nرابط الملف: ${urlData.publicUrl}\n\nالرجاء مراجعة الملف وتقديم ملاحظاتك.` };
        const allMessages = [...messages, userMsg];
        setMessages(allMessages);
        setIsLoading(true);
        await streamChat(allMessages, sessionData.sessionId);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "عذراً، حدث خطأ أثناء رفع الملف." }]);
    } finally {
      setUploadingFile(false);
    }
  };

  const streamChat = async (allMessages: Msg[], sessionId: string, multimodalContent?: any[]) => {
    let assistantSoFar = "";
    try {
      const body: any = {
        messages: allMessages
          .filter((m) => m !== DISCLAIMER)
          .map((m) => ({ role: m.role, content: m.content })),
        agent: "career_twin",
        session_id: sessionId,
      };
      if (multimodalContent) {
        body.multimodal_content = multimodalContent;
      }

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

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !sessionData) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);
    await streamChat(allMessages, sessionData.sessionId);
  };

  // Expose open method globally
  useEffect(() => {
    (window as any).__openFloatingChat = () => setOpen(true);
    return () => {
      delete (window as any).__openFloatingChat;
    };
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
        <div className="fixed bottom-6 left-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-4rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
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

          {/* Pre-Chat Form or Chat */}
          {!sessionData ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <PreChatForm onSubmit={handlePreChat} />
            </div>
          ) : (
            <>
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
                        {msg.role === "assistant" ? (
                          <Bot className="h-3.5 w-3.5" />
                        ) : (
                          <User className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 text-sm font-arabic leading-relaxed ${
                          msg.role === "assistant"
                            ? "bg-secondary text-foreground"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || uploadingFile}
                    className="text-muted-foreground hover:text-primary shrink-0"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
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
            </>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingAIChat;
