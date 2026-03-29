import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Lock, LogOut, Inbox, Brain, Settings, FileText, Building2, MessageCircle, Loader2, Plus, Eye } from "lucide-react";

const ADMIN_PASS = "Bashniny@2024";

const Admin = () => {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");

  // Data
  const [jobApps, setJobApps] = useState<any[]>([]);
  const [companyReqs, setCompanyReqs] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // AI Trainer
  const [unanswered, setUnanswered] = useState<any[]>([]);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [newCat, setNewCat] = useState("");
  const [kbEntries, setKbEntries] = useState<any[]>([]);

  // Settings
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");

  const login = () => {
    if (password === ADMIN_PASS) {
      setAuthed(true);
      sessionStorage.setItem("admin_auth", "true");
    } else {
      toast({ title: "خطأ", description: "كلمة المرور غير صحيحة", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") === "true") setAuthed(true);
  }, []);

  useEffect(() => {
    if (authed) loadData();
  }, [authed]);

  const loadData = async () => {
    setLoading(true);

    // Use service role through edge function for reading protected data
    const { data: jobs } = await supabase.functions.invoke("admin-data", { body: { table: "job_applications" } });
    const { data: companies } = await supabase.functions.invoke("admin-data", { body: { table: "company_requests" } });
    const { data: consults } = await supabase.functions.invoke("admin-data", { body: { table: "consultations" } });
    const { data: logs } = await supabase.functions.invoke("admin-data", { body: { table: "chat_logs" } });
    const { data: kb } = await supabase.functions.invoke("admin-data", { body: { table: "ai_knowledge_base" } });
    const { data: settings } = await supabase.functions.invoke("admin-data", { body: { table: "admin_settings" } });

    setJobApps(jobs?.data || []);
    setCompanyReqs(companies?.data || []);
    setConsultations(consults?.data || []);
    setChatLogs(logs?.data || []);
    setKbEntries(kb?.data || []);

    // Find unanswered - user messages not matched in KB
    const userMsgs = (logs?.data || []).filter((l: any) => l.role === "user");
    const kbQuestions = (kb?.data || []).map((k: any) => k.question.toLowerCase());
    const unmatched = userMsgs.filter(
      (m: any) => !kbQuestions.some((q: string) => q.includes(m.message.toLowerCase()) || m.message.toLowerCase().includes(q))
    );
    setUnanswered(unmatched.slice(0, 20));

    // Load settings
    if (settings?.data) {
      const bt = settings.data.find((s: any) => s.setting_key === "telegram_bot_token");
      const ci = settings.data.find((s: any) => s.setting_key === "telegram_chat_id");
      if (bt) setBotToken(bt.setting_value || "");
      if (ci) setChatId(ci.setting_value || "");
    }

    setLoading(false);
  };

  const addToKB = async () => {
    if (!newQ || !newA) return;
    await supabase.functions.invoke("admin-data", {
      body: { action: "insert", table: "ai_knowledge_base", data: { question: newQ, answer: newA, category: newCat || null } },
    });
    toast({ title: "تم", description: "تمت إضافة السؤال لقاعدة المعرفة" });
    setNewQ("");
    setNewA("");
    setNewCat("");
    loadData();
  };

  const saveSettings = async () => {
    await supabase.functions.invoke("admin-data", {
      body: {
        action: "upsert_settings",
        data: [
          { setting_key: "telegram_bot_token", setting_value: botToken },
          { setting_key: "telegram_chat_id", setting_value: chatId },
        ],
      },
    });
    toast({ title: "تم", description: "تم حفظ الإعدادات" });
  };

  if (!authed) {
    return (
      <div dir="rtl" className="min-h-screen bg-navy-gradient flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-8 max-w-sm w-full">
          <div className="text-center mb-6">
            <Lock className="h-12 w-12 text-primary mx-auto mb-3" />
            <h2 className="text-xl font-bold font-arabic text-foreground">لوحة التحكم</h2>
            <p className="text-muted-foreground font-arabic text-sm">أدخل كلمة المرور للدخول</p>
          </div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="كلمة المرور"
            className="mb-4 text-right font-arabic"
          />
          <Button onClick={login} className="w-full bg-gold-shimmer text-primary-foreground font-arabic">
            دخول
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-navy-gradient">
      <div className="bg-navy-deep border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold font-arabic text-foreground">
          لوحة تحكم <span className="text-primary">باشنيني</span>
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setAuthed(false); sessionStorage.removeItem("admin_auth"); }}
          className="font-arabic text-muted-foreground"
        >
          <LogOut className="h-4 w-4 ml-1" /> خروج
        </Button>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "طلبات التوظيف", count: jobApps.length, icon: FileText, color: "text-blue-400" },
            { label: "طلبات الشركات", count: companyReqs.length, icon: Building2, color: "text-green-400" },
            { label: "الاستشارات", count: consultations.length, icon: MessageCircle, color: "text-yellow-400" },
            { label: "قاعدة المعرفة", count: kbEntries.length, icon: Brain, color: "text-purple-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div className="text-left">
                  <p className="text-2xl font-bold text-foreground">{stat.count}</p>
                  <p className="text-xs text-muted-foreground font-arabic">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="inbox">
          <TabsList className="bg-secondary mb-6">
            <TabsTrigger value="inbox" className="font-arabic"><Inbox className="h-4 w-4 ml-1" />البريد الوارد</TabsTrigger>
            <TabsTrigger value="trainer" className="font-arabic"><Brain className="h-4 w-4 ml-1" />مدرب الذكاء</TabsTrigger>
            <TabsTrigger value="settings" className="font-arabic"><Settings className="h-4 w-4 ml-1" />الإعدادات</TabsTrigger>
          </TabsList>

          <TabsContent value="inbox">
            <Tabs defaultValue="jobs">
              <TabsList className="bg-secondary/50 mb-4">
                <TabsTrigger value="jobs" className="font-arabic text-xs">طلبات التوظيف</TabsTrigger>
                <TabsTrigger value="companies" className="font-arabic text-xs">طلبات الشركات</TabsTrigger>
                <TabsTrigger value="consults" className="font-arabic text-xs">الاستشارات</TabsTrigger>
              </TabsList>

              <TabsContent value="jobs">
                {loading ? <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /> : (
                  <div className="space-y-3">
                    {jobApps.length === 0 && <p className="text-muted-foreground font-arabic text-center py-8">لا توجد طلبات</p>}
                    {jobApps.map((app: any) => (
                      <div key={app.id} className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <span className="text-xs text-primary font-mono">{app.reference_number}</span>
                          <div className="text-right">
                            <h4 className="font-bold font-arabic text-foreground">{app.full_name}</h4>
                            <p className="text-sm text-muted-foreground font-arabic">{app.city} • {app.department}</p>
                            <p className="text-sm text-muted-foreground" dir="ltr">{app.phone}</p>
                          </div>
                        </div>
                        {app.cv_url && (
                          <p className="text-xs text-primary mt-2 font-arabic">📎 {app.cv_url}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{new Date(app.created_at).toLocaleDateString("ar-SA")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="companies">
                <div className="space-y-3">
                  {companyReqs.length === 0 && <p className="text-muted-foreground font-arabic text-center py-8">لا توجد طلبات</p>}
                  {companyReqs.map((req: any) => (
                    <div key={req.id} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <span className="text-xs text-primary font-mono">{req.reference_number}</span>
                        <div className="text-right">
                          <h4 className="font-bold font-arabic text-foreground">{req.company_name}</h4>
                          <p className="text-sm text-muted-foreground font-arabic">{req.contact_person} • {req.contact_email}</p>
                          <p className="text-sm text-muted-foreground font-arabic">{req.hiring_needs}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(req.created_at).toLocaleDateString("ar-SA")}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="consults">
                <div className="space-y-3">
                  {consultations.length === 0 && <p className="text-muted-foreground font-arabic text-center py-8">لا توجد استشارات</p>}
                  {consultations.map((c: any) => (
                    <div key={c.id} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-primary font-mono">{c.reference_number}</span>
                          {c.needs_human_review && <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded font-arabic">يحتاج مراجعة</span>}
                        </div>
                        <div className="text-right">
                          <h4 className="font-bold font-arabic text-foreground">{c.visitor_name || "زائر"}</h4>
                          <p className="text-sm text-muted-foreground font-arabic">{c.issue_category}</p>
                          {c.summary && <p className="text-sm text-muted-foreground font-arabic mt-1">{c.summary.slice(0, 100)}...</p>}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(c.created_at).toLocaleDateString("ar-SA")}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="trainer">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Unanswered */}
              <div>
                <h3 className="text-lg font-bold font-arabic text-foreground mb-4">أسئلة بدون إجابة</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {unanswered.length === 0 && <p className="text-muted-foreground font-arabic text-sm">لا توجد أسئلة جديدة</p>}
                  {unanswered.map((q: any, i: number) => (
                    <div
                      key={i}
                      className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-primary/40 transition-colors"
                      onClick={() => setNewQ(q.message)}
                    >
                      <p className="text-sm font-arabic text-foreground">{q.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(q.created_at).toLocaleDateString("ar-SA")}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add to KB */}
              <div>
                <h3 className="text-lg font-bold font-arabic text-foreground mb-4">إضافة لقاعدة المعرفة</h3>
                <div className="space-y-3">
                  <Input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="السؤال" className="text-right font-arabic" />
                  <Textarea value={newA} onChange={(e) => setNewA(e.target.value)} placeholder="الإجابة" className="text-right font-arabic" rows={4} />
                  <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="الفئة (اختياري)" className="text-right font-arabic" />
                  <Button onClick={addToKB} className="w-full bg-gold-shimmer text-primary-foreground font-arabic">
                    <Plus className="h-4 w-4 ml-1" /> إضافة
                  </Button>
                </div>

                <h4 className="text-sm font-bold font-arabic text-foreground mt-6 mb-3">قاعدة المعرفة الحالية ({kbEntries.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {kbEntries.map((kb: any) => (
                    <div key={kb.id} className="bg-secondary/30 rounded-lg p-2">
                      <p className="text-xs font-arabic text-primary">{kb.question}</p>
                      <p className="text-xs font-arabic text-muted-foreground">{kb.answer.slice(0, 80)}...</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="max-w-lg">
              <h3 className="text-lg font-bold font-arabic text-foreground mb-6">إعدادات التكامل</h3>
              <div className="space-y-4">
                <div>
                  <label className="block font-arabic text-sm text-foreground mb-1">Telegram Bot Token</label>
                  <Input value={botToken} onChange={(e) => setBotToken(e.target.value)} className="font-mono text-sm" dir="ltr" placeholder="123456:ABC-DEF..." />
                </div>
                <div>
                  <label className="block font-arabic text-sm text-foreground mb-1">Telegram Chat ID</label>
                  <Input value={chatId} onChange={(e) => setChatId(e.target.value)} className="font-mono text-sm" dir="ltr" placeholder="-100..." />
                </div>
                <div className="pt-2">
                  <h4 className="font-arabic text-sm text-foreground mb-2">السيرة الذاتية</h4>
                  <div className="flex gap-2">
                    <a href="/cv/CV-Ar.docx" download className="text-sm text-primary hover:underline font-arabic">📄 CV عربي</a>
                    <a href="/cv/CV-En.docx" download className="text-sm text-primary hover:underline font-arabic">📄 CV إنجليزي</a>
                  </div>
                </div>
                <Button onClick={saveSettings} className="bg-gold-shimmer text-primary-foreground font-arabic glow-gold">
                  حفظ الإعدادات
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
