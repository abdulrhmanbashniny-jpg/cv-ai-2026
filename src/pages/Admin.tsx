import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Lock, Menu, Save, Loader2, AlertTriangle, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminInbox from "@/components/admin/AdminInbox";
import AdminIntegrations from "@/components/admin/AdminIntegrations";
import AdminContent from "@/components/admin/AdminContent";
import AdminCAIO from "@/components/admin/AdminCAIO";
import AdminResumeManager from "@/components/admin/AdminResumeManager";
import AdminStoreManager from "@/components/admin/AdminStoreManager";
import AdminMarketingHub from "@/components/admin/AdminMarketingHub";
import AdminAdsManager from "@/components/admin/AdminAdsManager";
import AdminAICommandCenter from "@/components/admin/AdminAICommandCenter";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminNotifications from "@/components/admin/AdminNotifications";

const Admin = () => {
  const [authed, setAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  const [jobApps, setJobApps] = useState<any[]>([]);
  const [companyReqs, setCompanyReqs] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [kbEntries, setKbEntries] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<Record<string, number>>({});
  const [systemHealth, setSystemHealth] = useState<{ ai: boolean | null; telegram: boolean | null; database: boolean | null }>({ ai: null, telegram: null, database: null });

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);

  // Check for existing Supabase Auth session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAuthed(true);
      }
      setAuthLoading(false);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session?.user);
      if (!session?.user) setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async () => {
    if (!email.trim() || !password.trim()) {
      toast({ title: "خطأ", description: "البريد الإلكتروني وكلمة المرور مطلوبان", variant: "destructive" });
      return;
    }
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      toast({ title: "خطأ", description: "بيانات الدخول غير صحيحة", variant: "destructive" });
    }
    setLoginLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAuthed(false);
  };

  useEffect(() => { if (authed) loadData(); }, [authed]);

  const loadData = async () => {
    setLoading(true);
    const [jobs, companies, consults, logs, kb, settingsRes, contacts] = await Promise.all([
      supabase.functions.invoke("admin-data", { body: { table: "job_applications" } }),
      supabase.functions.invoke("admin-data", { body: { table: "company_requests" } }),
      supabase.functions.invoke("admin-data", { body: { table: "consultations" } }),
      supabase.functions.invoke("admin-data", { body: { table: "chat_logs" } }),
      supabase.functions.invoke("admin-data", { body: { table: "ai_knowledge_base" } }),
      supabase.functions.invoke("admin-data", { body: { table: "admin_settings" } }),
      supabase.functions.invoke("admin-data", { body: { table: "contact_requests" } }),
    ]);

    setJobApps(jobs.data?.data || []);
    setCompanyReqs(companies.data?.data || []);
    setConsultations(consults.data?.data || []);
    setContactMessages(contacts.data?.data || []);
    setChatLogs(logs.data?.data || []);
    setKbEntries(kb.data?.data || []);

    const s: Record<string, string> = {};
    (settingsRes.data?.data || []).forEach((item: any) => { s[item.setting_key] = item.setting_value || ""; });
    setSettings(s);
    setMaintenanceMode(s.maintenance_mode === "true");

    setStats({
      job_applications: (jobs.data?.data || []).length,
      company_requests: (companies.data?.data || []).length,
      consultations: (consults.data?.data || []).length,
      ai_knowledge_base: (kb.data?.data || []).length,
      chat_logs: (logs.data?.data || []).length,
    });

    setSystemHealth((prev) => ({ ...prev, database: true }));
    const hasTelegram = Boolean(s.telegram_bot_token && s.telegram_chat_id);
    setSystemHealth((prev) => ({ ...prev, telegram: hasTelegram }));

    try {
      const { data } = await supabase.functions.invoke("admin-data", { body: { action: "test_ai" } });
      setSystemHealth((prev) => ({ ...prev, ai: data?.ok || false }));
    } catch { setSystemHealth((prev) => ({ ...prev, ai: false })); }

    setLoading(false);
  };

  const saveSettings = async (data: { setting_key: string; setting_value: string }[]) => {
    await supabase.functions.invoke("admin-data", { body: { action: "upsert_settings", data } });
    const updated = { ...settings };
    data.forEach((d) => { updated[d.setting_key] = d.setting_value; });
    setSettings(updated);
  };

  const toggleMaintenance = async (val: boolean) => {
    setSavingMaintenance(true);
    setMaintenanceMode(val);
    await saveSettings([{ setting_key: "maintenance_mode", setting_value: String(val) }]);
    setSavingMaintenance(false);
    toast({ title: "تم", description: val ? "تم تفعيل وضع الصيانة" : "تم إيقاف وضع الصيانة" });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-navy-gradient flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div dir="rtl" className="min-h-screen bg-navy-gradient flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-8 max-w-sm w-full">
          <div className="text-center mb-6">
            <Lock className="h-12 w-12 text-primary mx-auto mb-3" />
            <h2 className="text-xl font-bold font-arabic text-foreground">لوحة التحكم</h2>
            <p className="text-muted-foreground font-arabic text-sm">سجّل دخولك للمتابعة</p>
          </div>
          <div className="space-y-3">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              placeholder="البريد الإلكتروني"
              className="text-right font-arabic"
              dir="ltr"
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              placeholder="كلمة المرور"
              className="text-right font-arabic"
            />
            <Button onClick={login} disabled={loginLoading} className="w-full bg-gold-shimmer text-primary-foreground font-arabic">
              {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "دخول"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const titles: Record<string, string> = {
    dashboard: "لوحة التحكم",
    inbox: "البريد الوارد",
    aiCommand: "مركز قيادة الوكلاء",
    caio: "المحلل الذكي (CAIO)",
    orders: "الطلبات",
    resume: "مدير السيرة الذاتية",
    store: "مدير المتجر",
    marketing: "العملاء المحتملون",
    ads: "مدير الإعلانات",
    notifications: "مركز التنبيهات",
    content: "إدارة المحتوى",
    integrations: "التكاملات",
    settings: "الإعدادات",
  };

  return (
    <div dir="rtl">
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-navy-gradient">
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout} />
          <div className="flex-1 flex flex-col min-h-screen">
            <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50 backdrop-blur-sm">
              <div />
              <h1 className="text-sm font-bold font-arabic text-foreground">{titles[activeTab]}</h1>
              <SidebarTrigger className="mr-2"><Menu className="h-5 w-5" /></SidebarTrigger>
            </header>
            <main className="flex-1 p-4 md:p-6 overflow-auto">
              {activeTab === "dashboard" && <AdminDashboard stats={stats} systemHealth={systemHealth} jobApps={jobApps} companyReqs={companyReqs} consultations={consultations} />}
              {activeTab === "inbox" && <AdminInbox jobApps={jobApps} companyReqs={companyReqs} consultations={consultations} contactMessages={contactMessages} loading={loading} onRefresh={loadData} />}
              {activeTab === "aiCommand" && <AdminAICommandCenter settings={settings} onSave={saveSettings} kbEntries={kbEntries} chatLogs={chatLogs} consultations={consultations} onRefresh={loadData} />}
              {activeTab === "caio" && <AdminCAIO chatLogs={chatLogs} consultations={consultations} jobApps={jobApps} companyReqs={companyReqs} contactMessages={contactMessages} />}
              {activeTab === "orders" && <AdminOrders />}
              {activeTab === "content" && <AdminContent settings={settings} onSave={saveSettings} />}
              {activeTab === "resume" && <AdminResumeManager />}
              {activeTab === "store" && <AdminStoreManager />}
              {activeTab === "marketing" && <AdminMarketingHub />}
              {activeTab === "ads" && <AdminAdsManager settings={settings} onSave={saveSettings} />}
              {activeTab === "notifications" && <AdminNotifications />}
              {activeTab === "integrations" && <AdminIntegrations settings={settings} onSave={saveSettings} />}
              {activeTab === "settings" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-arabic flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-400" /> وضع الصيانة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-xs text-muted-foreground font-arabic">عند تفعيل وضع الصيانة، سيظهر للزوار صفحة "تحت التحديث".</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch checked={maintenanceMode} onCheckedChange={toggleMaintenance} disabled={savingMaintenance} id="maintenance" />
                          <Label htmlFor="maintenance" className="font-arabic text-sm cursor-pointer">{maintenanceMode ? "مفعّل" : "معطّل"}</Label>
                        </div>
                        <span className="font-arabic text-sm font-medium text-foreground">وضع الصيانة</span>
                      </div>
                      {savingMaintenance && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    </CardContent>
                  </Card>
                </div>
              )}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Admin;
