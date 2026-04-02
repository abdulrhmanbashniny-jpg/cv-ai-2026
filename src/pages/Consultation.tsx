import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Bot, User, CheckCircle, Loader2, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyfncdQeFaRkC_FVrnZKeYmcoZ4S5_qml_ujzz4WMz6vRAfFynROBcSgRPt3t-KcaXd/exec";

type Msg = { role: "user" | "assistant"; content: string };
type Step = "info" | "chat" | "done";

const categories = [
  "نظام العمل السعودي",
  "عقود العمل",
  "الفصل والإنهاء",
  "الإجازات والمستحقات",
  "التأمينات الاجتماعية",
  "نظام حماية الأجور",
  "سياسات الموارد البشرية",
  "أخرى",
];

const generateRefNumber = () => {
  const year = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `ARB-${year}-${num}`;
};

const Consultation = () => {
  const [scriptUrl, setScriptUrl] = useState(DEFAULT_SCRIPT_URL);
  const [step, setStep] = useState<Step>("info");
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [category, setCategory] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refNumber, setRefNumber] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smart scroll: only scroll if user is near bottom
  useEffect(() => {
    const container = chatEndRef.current?.parentElement;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (isNearBottom) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // BeforeUnload guard
  useEffect(() => {
    if (step !== "chat") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "هل تود إنهاء الاستشارة وحفظ الرقم المرجعي قبل الخروج؟";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [step]);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const { data } = await supabase.functions.invoke("admin-data", { body: { table: "admin_settings" } });
        const settings = data?.data || [];
        const found = settings.find((s: any) => s.setting_key === "google_script_url");
        if (found?.setting_value) setScriptUrl(found.setting_value);
      } catch { /* use default */ }
    };
    fetchUrl();
  }, []);

  const startChat = () => {
    if (!visitorName.trim() || !visitorPhone.trim() || !category || !consent) return;
    const ref = generateRefNumber();
    const sid = uuidv4();
    setRefNumber(ref);
    setSessionId(sid);

    const disclaimer: Msg = {
      role: "assistant",
      content: `تنويه هام: هذا المساعد الذكي أداة استرشادية لتقديم معلومات عامة ولا يُغني عن الاستشارة المهنية أو القانونية المباشرة. استخدامك للدردشة يُعد موافقة صريحة وإخلاءً لمسؤولية المنصة عن أي قرارات تُبنى على هذه الردود. كيف يمكنني مساعدتك؟`,
    };
    const greeting: Msg = {
      role: "assistant",
      content: `مرحباً ${visitorName}! أنا المستشار القانوني الذكي للأستاذ عبدالرحمن باشنيني. رقم استشارتك هو: **${ref}**\n\nكيف يمكنني مساعدتك في موضوع "${category}"؟ يرجى وصف مشكلتك بالتفصيل.`,
    };
    setMessages([disclaimer, greeting]);
    setStep("chat");
  };

  const handleFileUpload = async (file: File) => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "خطأ", description: "حجم الملف كبير جداً (الحد 10 ميجابايت)", variant: "destructive" });
      return;
    }

    try {
      const ext = file.name.split(".").pop();
      const path = `chat-uploads/${sessionId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("cv-uploads").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("cv-uploads").getPublicUrl(path);

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = async () => {
          const userMsg: Msg = { role: "user", content: `[مرفق: ${file.name}]` };
          const allMessages = [...messages, userMsg];
          setMessages(allMessages);
          setIsLoading(true);
          await streamChat(allMessages, [
            { type: "image_url", image_url: { url: reader.result as string } },
            { type: "text", text: `المستخدم أرفق صورة "${file.name}". حلل محتواها.` },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        const userMsg: Msg = { role: "user", content: `أرفقت ملف: ${file.name}\nرابط: ${urlData.publicUrl}\n\nالرجاء مراجعته.` };
        const allMessages = [...messages, userMsg];
        setMessages(allMessages);
        setIsLoading(true);
        await streamChat(allMessages);
      }
    } catch {
      toast({ title: "خطأ", description: "فشل رفع الملف", variant: "destructive" });
    }
  };

  const streamChat = async (allMessages: Msg[], multimodalContent?: any[]) => {
    let assistantSoFar = "";
    try {
      const body: any = {
        messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
        agent: "legal_advisor",
        session_id: sessionId,
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

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);
    await streamChat(allMessages);
  };

  const endConsultation = async () => {
    setIsLoading(true);
    const chatSummary = messages.filter((m) => m.role === "user").map((m) => m.content).join(" | ");
    const summary = chatSummary.slice(0, 500);
    const needsReview = messages.some((m) => m.role === "assistant" && (m.content.includes("سأستشير") || m.content.includes("أعود إليك")));
    const aiResponse = messages.filter((m) => m.role === "assistant").map((m) => m.content).join("\n---\n");

    fetch(scriptUrl, { method: "POST", mode: "no-cors", body: JSON.stringify({ type: "consultation", visitor_name: visitorName, issue_category: category, reference_number: refNumber, summary, needs_human_review: needsReview, ai_response: aiResponse, status: "closed" }) }).catch(() => {});
    supabase.functions.invoke("admin-data", { body: { action: "insert", table: "consultations", data: { visitor_name: visitorName, issue_category: category, reference_number: refNumber, summary, needs_human_review: needsReview, ai_response: aiResponse, status: "closed" } } }).catch(() => {});
    supabase.functions.invoke("notify-telegram", { body: { type: "consultation", data: { visitor_name: visitorName, issue_category: category, reference_number: refNumber, summary, needs_human_review: needsReview } } }).catch(() => {});

    setStep("done");
    setIsLoading(false);
  };

  return (
    <div dir="rtl" className="min-h-screen">
      <Navbar />
      <section className="pt-24 pb-16 min-h-screen bg-navy-gradient">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold font-arabic text-foreground mb-4">
              المستشار <span className="text-gradient-gold">العمالي</span>
            </h1>
            <p className="text-muted-foreground font-arabic">
              احصل على استشارة فورية في نظام العمل والموارد البشرية
            </p>
          </div>

          {step === "info" && (
            <div className="bg-card border border-border rounded-xl p-8 max-w-md mx-auto space-y-5">
              <div>
                <label className="block font-arabic text-sm text-foreground mb-2">الاسم *</label>
                <Input value={visitorName} onChange={(e) => setVisitorName(e.target.value)} placeholder="أدخل اسمك" className="text-right font-arabic" />
              </div>
              <div>
                <label className="block font-arabic text-sm text-foreground mb-2">رقم الجوال *</label>
                <Input value={visitorPhone} onChange={(e) => setVisitorPhone(e.target.value)} placeholder="05XXXXXXXX" className="font-mono text-sm" dir="ltr" />
              </div>
              <div>
                <label className="block font-arabic text-sm text-foreground mb-2">فئة الاستشارة *</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="text-right font-arabic"><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c} className="font-arabic">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="consult-consent" checked={consent} onCheckedChange={(v) => { setConsent(v === true); if (v === true) setConsentError(false); }} className="mt-1" />
                <label htmlFor="consult-consent" className="text-xs text-muted-foreground font-arabic leading-relaxed cursor-pointer">
                  أوافق على <a href="/privacy-policy" target="_blank" className="text-primary underline hover:opacity-80">سياسة الخصوصية</a> ومعالجة بياناتي وفقاً لنظام حماية البيانات الشخصية.
                </label>
              </div>
              {consentError && (
                <p className="text-destructive text-xs font-arabic text-center">يجب الموافقة على سياسة الخصوصية أولاً</p>
              )}
              <Button onClick={handleStartChat} disabled={!visitorName.trim() || !visitorPhone.trim() || !category} className="w-full bg-gold-shimmer text-primary-foreground font-arabic glow-gold">
                بدء الاستشارة
              </Button>
            </div>
          )}

          {step === "chat" && (
            <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col" style={{ height: "60vh" }}>
              <div className="bg-secondary/50 px-4 py-3 border-b border-border flex items-center justify-between">
                <Button size="sm" variant="destructive" onClick={endConsultation} className="font-arabic text-xs">إنهاء الاستشارة</Button>
                <span className="text-xs text-muted-foreground font-arabic">رقم المرجع: {refNumber}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-primary/20" : "bg-secondary"}`}>
                      {msg.role === "assistant" ? <Bot className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-foreground" />}
                    </div>
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.role === "user" ? "bg-primary/20 text-foreground" : "bg-secondary text-foreground"}`}>
                      <div className="font-arabic text-sm prose prose-sm prose-invert max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><Bot className="h-4 w-4 text-primary" /></div>
                    <div className="bg-secondary rounded-xl px-4 py-3"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-border flex gap-2">
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} />
                <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="text-muted-foreground hover:text-primary shrink-0">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button onClick={sendMessage} disabled={!input.trim() || isLoading} size="icon" className="bg-primary text-primary-foreground shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
                <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="اكتب رسالتك..." className="text-right font-arabic" disabled={isLoading} />
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="bg-card border border-border rounded-xl p-8 max-w-md mx-auto text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold font-arabic text-foreground mb-2">تم إنهاء الاستشارة</h3>
              <p className="text-muted-foreground font-arabic mb-4">رقم المرجع: <span className="text-primary font-bold">{refNumber}</span></p>
              <p className="text-muted-foreground font-arabic text-sm mb-6">احتفظ برقم المرجع للمتابعة.</p>
              <Button onClick={() => window.location.href = "/"} className="bg-gold-shimmer text-primary-foreground font-arabic">العودة للرئيسية</Button>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Consultation;
