import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Lock, Menu } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminInbox from "@/components/admin/AdminInbox";
import AdminAIManager from "@/components/admin/AdminAIManager";
import AdminIntegrations from "@/components/admin/AdminIntegrations";
import AdminContent from "@/components/admin/AdminContent";

const ADMIN_PASS = "Bashniny@2024";

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

  const login = () => {
    if (password === ADMIN_PASS) {
      setAuthed(true);
      sessionStorage.setItem("admin_auth", "true");
    } else {
      toast({ title: "خطأ", description: "كلمة المرور غير صحيحة", variant: "destructive" });
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
      checkHealth();
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

    // Parse settings
    const s: Record<string, string> = {};
    (settingsRes.data?.data || []).forEach((item: any) => {
      s[item.setting_key] = item.setting_value || "";
    });
    setSettings(s);

    // Set stats
    setStats({
      job_applications: (jobs.data?.data || []).length,
      company_requests: (companies.data?.data || []).length,
      consultations: (consults.data?.data || []).length,
      ai_knowledge_base: (kb.data?.data || []).length,
      chat_logs: (logs.data?.data || []).length,
    });

    setLoading(false);
  };

  const checkHealth = async () => {
    // Database is always connected if we got here
    setSystemHealth((prev) => ({ ...prev, database: true }));

    // Test AI
    try {
      const { data } = await supabase.functions.invoke("admin-data", { body: { action: "test_ai" } });
      setSystemHealth((prev) => ({ ...prev, ai: data?.ok || false }));
    } catch {
      setSystemHealth((prev) => ({ ...prev, ai: false }));
    }

    // Check telegram settings existence
    const hasTelegram = Boolean(settings.telegram_bot_token && settings.telegram_chat_id);
    setSystemHealth((prev) => ({ ...prev, telegram: hasTelegram ? null : false }));
  };

  const saveSettings = async (data: { setting_key: string; setting_value: string }[]) => {
    await supabase.functions.invoke("admin-data", {
      body: { action: "upsert_settings", data },
    });
    // Update local settings
    const updated = { ...settings };
    data.forEach((d) => { updated[d.setting_key] = d.setting_value; });
    setSettings(updated);
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
    ai: "إدارة الذكاء الاصطناعي",
    content: "إدارة المحتوى",
    integrations: "التكاملات",
  };

  return (
    <div dir="rtl">
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-navy-gradient">
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout} />
          <div className="flex-1 flex flex-col min-h-screen">
            {/* Header */}
            <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50 backdrop-blur-sm">
              <div />
              <h1 className="text-sm font-bold font-arabic text-foreground">
                {titles[activeTab]}
              </h1>
              <SidebarTrigger className="mr-2">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
            </header>

            {/* Content */}
            <main className="flex-1 p-4 md:p-6 overflow-auto">
              {activeTab === "dashboard" && (
                <AdminDashboard stats={stats} systemHealth={systemHealth} jobApps={jobApps} companyReqs={companyReqs} consultations={consultations} />
              )}
              {activeTab === "inbox" && (
                <AdminInbox jobApps={jobApps} companyReqs={companyReqs} consultations={consultations} loading={loading} onRefresh={loadData} />
              )}
              {activeTab === "ai" && (
                <AdminAIManager kbEntries={kbEntries} chatLogs={chatLogs} onRefresh={loadData} />
              )}
              {activeTab === "content" && (
                <AdminContent settings={settings} onSave={saveSettings} />
              )}
              {activeTab === "integrations" && (
                <AdminIntegrations settings={settings} onSave={saveSettings} />
              )}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Admin;
