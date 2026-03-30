import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Lock, Menu, Save, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminInbox from "@/components/admin/AdminInbox";
import AdminAIManager from "@/components/admin/AdminAIManager";
import AdminIntegrations from "@/components/admin/AdminIntegrations";
import AdminContent from "@/components/admin/AdminContent";
import AdminChatHistory from "@/components/admin/AdminChatHistory";
import AdminAgentPrompts from "@/components/admin/AdminAgentPrompts";

const Admin = () => {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  // Data
  const [jobApps, setJobApps] = useState<any[]>([]);
  const [companyReqs, setCompanyReqs] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [kbEntries, setKbEntries] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<Record<string, number>>({});
  const [systemHealth, setSystemHealth] = useState<{ ai: boolean | null; telegram: boolean | null; database: boolean | null }>({ ai: null, telegram: null, database: null });

  // Settings tab state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);

  const login = async () => {
    // Check DB for custom password first
    try {
      const { data } = await supabase.functions.invoke("admin-data", { body: { table: "admin_settings" } });
      const allSettings = data?.data || [];
      const dbPass = allSettings.find((s: any) => s.setting_key === "admin_password")?.setting_value;
      const correctPass = dbPass || "Bashniny@2024";
      
      if (password === correctPass) {
        setAuthed(true);
        sessionStorage.setItem("admin_auth", "true");
      } else {
        toast({ title: "خطأ", description: "كلمة المرور غير صحيحة", variant: "destructive" });
      }
    } catch {
      if (password === "Bashniny@2024") {
        setAuthed(true);
        sessionStorage.setItem("admin_auth", "true");
      } else {
        toast({ title: "خطأ", description: "كلمة المرور غير صحيحة", variant: "destructive" });
      }
    }
  };

  const logout = () => {
    setAuthed(false);
    sessionStorage.removeItem("admin_auth");
  };

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") === "true") setAuthed(true);
  }, []);

  useEffect(() => {
    if (authed) {
      loadData();
    }
  }, [authed]);

  const loadData = async () => {
    setLoading(true);
    const [jobs, companies, consults, logs, kb, settingsRes] = await Promise.all([
      supabase.functions.invoke("admin-data", { body: { table: "job_applications" } }),
      supabase.functions.invoke("admin-data", { body: { table: "company_requests" } }),
      supabase.functions.invoke("admin-data", { body: { table: "consultations" } }),
      supabase.functions.invoke("admin-data", { body: { table: "chat_logs" } }),
      supabase.functions.invoke("admin-data", { body: { table: "ai_knowledge_base" } }),
      supabase.functions.invoke("admin-data", { body: { table: "admin_settings" } }),
    ]);

    setJobApps(jobs.data?.data || []);
    setCompanyReqs(companies.data?.data || []);
    setConsultations(consults.data?.data || []);
    setChatLogs(logs.data?.data || []);
    setKbEntries(kb.data?.data || []);

    const s: Record<string, string> = {};
    (settingsRes.data?.data || []).forEach((item: any) => {
      s[item.setting_key] = item.setting_value || "";
    });
    setSettings(s);
    setMaintenanceMode(s.maintenance_mode === "true");

    setStats({
      job_applications: (jobs.data?.data || []).length,
      company_requests: (companies.data?.data || []).length,
      consultations: (consults.data?.data || []).length,
      ai_knowledge_base: (kb.data?.data || []).length,
      chat_logs: (logs.data?.data || []).length,
    });

    // System health
    setSystemHealth((prev) => ({ ...prev, database: true }));
    
    // Telegram: check if token and chatId exist in settings
    const hasTelegram = Boolean(s.telegram_bot_token && s.telegram_chat_id);
    setSystemHealth((prev) => ({ ...prev, telegram: hasTelegram }));

    try {
      const { data } = await supabase.functions.invoke("admin-data", { body: { action: "test_ai" } });
      setSystemHealth((prev) => ({ ...prev, ai: data?.ok || false }));
    } catch {
      setSystemHealth((prev) => ({ ...prev, ai: false }));
    }

    setLoading(false);
  };

  const saveSettings = async (data: { setting_key: string; setting_value: string }[]) => {
    await supabase.functions.invoke("admin-data", {
      body: { action: "upsert_settings", data },
    });
    const updated = { ...settings };
    data.forEach((d) => { updated[d.setting_key] = d.setting_value; });
    setSettings(updated);
  };

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "خطأ", description: "كلمات المرور غير متطابقة", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    await saveSettings([{ setting_key: "admin_password", setting_value: newPassword }]);
    setSavingPassword(false);
    setNewPassword("");
    setConfirmPassword("");
    toast({ title: "تم", description: "تم تغيير كلمة المرور بنجاح" });
  };

  const toggleMaintenance = async (val: boolean) => {
    setSavingMaintenance(true);
    setMaintenanceMode(val);
    await saveSettings([{ setting_key: "maintenance_mode", setting_value: String(val) }]);
    setSavingMaintenance(false);
    toast({ title: "تم", description: val ? "تم تفعيل وضع الصيانة" : "تم إيقاف وضع الصيانة" });
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

  const titles: Record<string, string> = {
    dashboard: "لوحة التحكم",
    inbox: "البريد الوارد",
    chatHistory: "سجل المحادثات",
    ai: "إدارة الذكاء الاصطناعي",
    agentPrompts: "إعدادات الوكلاء",
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
              <h1 className="text-sm font-bold font-arabic text-foreground">
                {titles[activeTab]}
              </h1>
              <SidebarTrigger className="mr-2">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
            </header>

            <main className="flex-1 p-4 md:p-6 overflow-auto">
              {activeTab === "dashboard" && (
                <AdminDashboard stats={stats} systemHealth={systemHealth} jobApps={jobApps} companyReqs={companyReqs} consultations={consultations} />
              )}
              {activeTab === "inbox" && (
                <AdminInbox jobApps={jobApps} companyReqs={companyReqs} consultations={consultations} loading={loading} onRefresh={loadData} />
              )}
              {activeTab === "chatHistory" && (
                <AdminChatHistory chatLogs={chatLogs} consultations={consultations} onRefresh={loadData} />
              )}
              {activeTab === "ai" && (
                <AdminAIManager kbEntries={kbEntries} chatLogs={chatLogs} onRefresh={loadData} />
              )}
              {activeTab === "agentPrompts" && (
                <AdminAgentPrompts settings={settings} onSave={saveSettings} />
              )}
              {activeTab === "content" && (
                <AdminContent settings={settings} onSave={saveSettings} />
              )}
              {activeTab === "integrations" && (
                <AdminIntegrations settings={settings} onSave={saveSettings} />
              )}
              {activeTab === "settings" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Change Password */}
                  <Card className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-arabic flex items-center gap-2">
                        <Lock className="h-4 w-4 text-primary" />
                        تغيير كلمة المرور
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="block font-arabic text-xs text-muted-foreground mb-1">كلمة المرور الجديدة</label>
                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="text-right font-arabic" placeholder="••••••••" />
                      </div>
                      <div>
                        <label className="block font-arabic text-xs text-muted-foreground mb-1">تأكيد كلمة المرور</label>
                        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="text-right font-arabic" placeholder="••••••••" />
                      </div>
                      <Button onClick={changePassword} disabled={savingPassword} className="w-full bg-gold-shimmer text-primary-foreground font-arabic gap-2">
                        {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        حفظ كلمة المرور
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Maintenance Mode */}
                  <Card className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-arabic flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        وضع الصيانة
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-xs text-muted-foreground font-arabic">
                        عند تفعيل وضع الصيانة، سيظهر للزوار صفحة "قريباً / تحت التحديث" بدلاً من الموقع.
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={maintenanceMode}
                            onCheckedChange={toggleMaintenance}
                            disabled={savingMaintenance}
                            id="maintenance"
                          />
                          <Label htmlFor="maintenance" className="font-arabic text-sm cursor-pointer">
                            {maintenanceMode ? "مفعّل" : "معطّل"}
                          </Label>
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
