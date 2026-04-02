import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Brain, Loader2, FileText, TrendingUp, Lightbulb, BarChart3, Send, Bot, User,
  Plus, Archive, Trash2, MessageSquare, Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface AdminCAIOProps {
  chatLogs: any[];
  consultations: any[];
  jobApps: any[];
  companyReqs: any[];
  contactMessages: any[];
}

type Msg = { role: "user" | "assistant"; content: string };

interface CaioSession {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const AdminCAIO = ({ chatLogs, consultations, jobApps, companyReqs, contactMessages }: AdminCAIOProps) => {
  const [report, setReport] = useState("");
  const [generating, setGenerating] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<CaioSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Chat
  const [chatMessages, setChatMessages] = useState<Msg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const isArchived = activeSession?.status === "archived";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Load sessions
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    const { data } = await supabase.functions.invoke("admin-data", {
      body: { action: "select", table: "caio_sessions" },
    });
    const rows = (data?.data || []).sort(
      (a: CaioSession, b: CaioSession) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setSessions(rows);
    setLoadingSessions(false);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load session messages
  const loadSessionMessages = useCallback(async (sessionId: string) => {
    const { data } = await supabase.functions.invoke("admin-data", {
      body: { action: "select", table: "chat_logs", filters: { session_id: sessionId } },
    });
    const logs = (data?.data || []).sort(
      (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    setChatMessages(logs.map((l: any) => ({ role: l.role as "user" | "assistant", content: l.message })));
  }, []);

  const selectSession = (id: string) => {
    setActiveSessionId(id);
    loadSessionMessages(id);
  };

  // Create new session
  const createSession = async () => {
    const title = `مناقشة ${new Date().toLocaleDateString("ar-SA")}`;
    const { data } = await supabase.functions.invoke("admin-data", {
      body: { action: "insert", table: "caio_sessions", data: { title, status: "open" } },
    });
    await loadSessions();
    const newId = data?.data?.[0]?.id;
    if (newId) {
      setActiveSessionId(newId);
      setChatMessages([]);
    }
    toast({ title: "تم", description: "تم إنشاء جلسة استراتيجية جديدة" });
  };

  // Archive session
  const archiveSession = async (id: string) => {
    await supabase.functions.invoke("admin-data", {
      body: { action: "update", table: "caio_sessions", id, data: { status: "archived" } },
    });
    await loadSessions();
    toast({ title: "تم", description: "تم أرشفة الجلسة" });
  };

  // Delete session
  const deleteSession = async (id: string) => {
    await supabase.functions.invoke("admin-data", {
      body: { action: "delete", table: "caio_sessions", id },
    });
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setChatMessages([]);
    }
    await loadSessions();
    toast({ title: "تم", description: "تم حذف الجلسة وسجلاتها" });
  };

  // Send message
  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading || !activeSessionId || isArchived) return;
    const userMsg: Msg = { role: "user", content: chatInput.trim() };
    const allMessages = [...chatMessages, userMsg];
    setChatMessages(allMessages);
    setChatInput("");
    setChatLoading(true);

    let assistantSoFar = "";
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          agent: "caio",
          session_id: activeSessionId,
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
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: [{ role: "user", content: "أنشئ تقريراً تنفيذياً شاملاً بـ 4 أقسام:\n### 1. ملخص أداء المنصة (أرقام حقيقية)\n### 2. تقييم أداء الوكلاء\n### 3. تحليل المبيعات والنماذج المميزة\n### 4. رؤى استراتيجية واقتراحات النمو" }], agent: "caio" }),
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Sessions Sidebar */}
            <Card className="border-border/50 lg:col-span-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Button size="sm" onClick={createSession} className="bg-primary text-primary-foreground font-arabic gap-1 text-xs">
                    <Plus className="h-3 w-3" /> جلسة جديدة
                  </Button>
                  <CardTitle className="text-sm font-arabic">الجلسات</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[45vh]">
                  <div className="space-y-1 p-3">
                    {loadingSessions && <p className="text-center py-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></p>}
                    {!loadingSessions && sessions.length === 0 && (
                      <p className="text-center py-8 text-muted-foreground font-arabic text-xs">لا توجد جلسات بعد</p>
                    )}
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        className={`group relative rounded-lg border p-3 cursor-pointer transition-colors text-right ${
                          activeSessionId === s.id
                            ? "border-primary/50 bg-primary/10"
                            : "border-transparent hover:bg-secondary/30"
                        }`}
                        onClick={() => selectSession(s.id)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {s.status === "open" && (
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); archiveSession(s.id); }}>
                                <Archive className="h-3 w-3 text-amber-400" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-arabic text-xs font-medium truncate">{s.title}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <Badge variant="outline" className={`text-[9px] ${s.status === "archived" ? "text-amber-400 border-amber-400/30" : "text-emerald-400 border-emerald-400/30"}`}>
                                {s.status === "archived" ? "مؤرشفة" : "مفتوحة"}
                              </Badge>
                              <span className="text-[9px] text-muted-foreground">
                                {new Date(s.created_at).toLocaleDateString("ar-SA")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="border-border/50 lg:col-span-3">
              <CardContent className="p-0">
                <div className="flex flex-col" style={{ height: "50vh" }}>
                  {!activeSessionId ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground font-arabic">
                      <div className="text-center">
                        <Brain className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>اختر جلسة أو أنشئ جلسة جديدة</p>
                        <Button onClick={createSession} className="mt-4 font-arabic gap-2">
                          <Plus className="h-4 w-4" /> مناقشة استراتيجية جديدة
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Session header */}
                      <div className="p-3 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isArchived && <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-400/30 font-arabic">مؤرشفة - للقراءة فقط</Badge>}
                          {activeSession?.status === "open" && (
                            <Button size="sm" variant="outline" className="text-xs font-arabic gap-1" onClick={() => archiveSession(activeSessionId!)}>
                              <Archive className="h-3 w-3" /> أرشفة الجلسة
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          <div>
                            <p className="font-arabic text-sm font-medium">{activeSession?.title}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(activeSession?.created_at || "").toLocaleDateString("ar-SA")}
                            </p>
                          </div>
                          <MessageSquare className="h-5 w-5 text-primary" />
                        </div>
                      </div>

                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                          {chatMessages.length === 0 && !isArchived && (
                            <div className="text-center py-12 text-muted-foreground font-arabic">
                              <Brain className="h-12 w-12 mx-auto mb-4 opacity-30" />
                              <p>ابدأ مناقشتك الاستراتيجية مع CAIO</p>
                              <p className="text-xs mt-2">سيتذكر CAIO سياق هذه الجلسة بالكامل</p>
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

                      {!isArchived && (
                        <div className="p-4 border-t border-border flex gap-2">
                          <Button onClick={sendChatMessage} disabled={!chatInput.trim() || chatLoading} size="icon" className="bg-primary text-primary-foreground shrink-0">
                            <Send className="h-4 w-4" />
                          </Button>
                          <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChatMessage()} placeholder="اسأل CAIO..." className="text-right font-arabic" disabled={chatLoading} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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
