import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Loader2, FileText, TrendingUp, Lightbulb, BarChart3, Send, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminCAIOProps {
  chatLogs: any[];
  consultations: any[];
  jobApps: any[];
  companyReqs: any[];
  contactMessages: any[];
}

type Msg = { role: "user" | "assistant"; content: string };

const AdminCAIO = ({ chatLogs, consultations, jobApps, companyReqs, contactMessages }: AdminCAIOProps) => {
  const [report, setReport] = useState("");
  const [generating, setGenerating] = useState(false);

  // Chat with CAIO
  const [chatMessages, setChatMessages] = useState<Msg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // No longer building client-side context - the edge function handles full DB snapshot for CAIO agent

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: Msg = { role: "user", content: chatInput.trim() };
    const allMessages = [...chatMessages, userMsg];
    setChatMessages(allMessages);
    setChatInput("");
    setChatLoading(true);

    let assistantSoFar = "";
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          agent: "caio",
        }),
      });

      if (!resp.ok) throw new Error("فشل الاتصال");
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
              setChatMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
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
      setChatLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    setReport("");
    try {
      const analyticsPrompt = `أنت كبير مسؤولي الذكاء الاصطناعي (CAIO). ${buildContext()}\n\nأنشئ تقريراً تنفيذياً بـ 3 أقسام:\n### 1. تقييم أداء الوكلاء\n### 2. اقتراحات تحسين البرومبت\n### 3. رؤى الجمهور واقتراحات الأعمال`;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: [{ role: "user", content: analyticsPrompt }], agent: "career_twin" }),
      });

      if (!resp.ok) throw new Error("فشل في إنشاء التقرير");
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullReport = "";

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
            if (content) { fullReport += content; setReport(fullReport); }
          } catch { /* partial */ }
        }
      }
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const userMsgCount = chatLogs.filter((l: any) => l.role === "user").length;
  const assistantMsgCount = chatLogs.filter((l: any) => l.role === "assistant").length;
  const reviewNeeded = consultations.filter((c: any) => c.needs_human_review).length;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50"><CardContent className="p-4 flex items-center gap-3"><BarChart3 className="h-8 w-8 text-blue-400" /><div><p className="text-2xl font-bold text-foreground">{userMsgCount}</p><p className="text-xs text-muted-foreground font-arabic">رسائل المستخدمين</p></div></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 flex items-center gap-3"><Brain className="h-8 w-8 text-purple-400" /><div><p className="text-2xl font-bold text-foreground">{assistantMsgCount}</p><p className="text-xs text-muted-foreground font-arabic">ردود الوكلاء</p></div></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="h-8 w-8 text-emerald-400" /><div><p className="text-2xl font-bold text-foreground">{consultations.length}</p><p className="text-xs text-muted-foreground font-arabic">إجمالي الاستشارات</p></div></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 flex items-center gap-3"><Lightbulb className="h-8 w-8 text-amber-400" /><div><p className="text-2xl font-bold text-foreground">{reviewNeeded}</p><p className="text-xs text-muted-foreground font-arabic">تحتاج مراجعة</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="font-arabic">
          <TabsTrigger value="report" className="font-arabic">التقرير التنفيذي</TabsTrigger>
          <TabsTrigger value="chat" className="font-arabic">دردشة مع CAIO</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="flex flex-col" style={{ height: "50vh" }}>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground font-arabic">
                        <Brain className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>اسأل CAIO عن أداء المنصة واستراتيجيات النمو</p>
                        <p className="text-xs mt-2">مثال: "ما هي أكثر الاستشارات شيوعاً؟" أو "اقترح طرق لزيادة التحميلات"</p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-primary/20" : "bg-secondary"}`}>
                          {msg.role === "assistant" ? <Bot className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-foreground" />}
                        </div>
                        <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.role === "user" ? "bg-primary/20" : "bg-secondary/50"}`}>
                          <div className="font-arabic text-sm prose prose-sm prose-invert max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                        </div>
                      </div>
                    ))}
                    {chatLoading && chatMessages[chatMessages.length - 1]?.role === "user" && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><Bot className="h-4 w-4 text-primary" /></div>
                        <div className="bg-secondary rounded-xl px-4 py-3"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-border flex gap-2">
                  <Button onClick={sendChatMessage} disabled={!chatInput.trim() || chatLoading} size="icon" className="bg-primary text-primary-foreground shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                  <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChatMessage()} placeholder="اسأل CAIO..." className="text-right font-arabic" disabled={chatLoading} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-arabic flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> التقرير التنفيذي</CardTitle>
                <Button onClick={generateReport} disabled={generating} className="bg-gold-shimmer text-primary-foreground font-arabic gap-2" size="sm">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} إنشاء التقرير
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {report ? (
                <div className="bg-secondary/30 rounded-xl p-6 font-arabic text-sm prose prose-sm prose-invert max-w-none" dir="rtl">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground font-arabic">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>اضغط على "إنشاء التقرير" لتحليل بيانات المنصة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCAIO;
