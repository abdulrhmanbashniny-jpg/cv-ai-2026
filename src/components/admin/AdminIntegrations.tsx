import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Brain, HardDrive, CheckCircle, XCircle, Loader2, Save, FileCode2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AdminIntegrationsProps {
  settings: Record<string, string>;
  onSave: (data: { setting_key: string; setting_value: string }[]) => Promise<void>;
}

const AdminIntegrations = ({ settings, onSave }: AdminIntegrationsProps) => {
  const [botToken, setBotToken] = useState(settings.telegram_bot_token || "");
  const [chatId, setChatId] = useState(settings.telegram_chat_id || "");
  const [activeModel, setActiveModel] = useState(settings.active_model || "google/gemini-3-flash-preview");
  const [driveJson, setDriveJson] = useState(settings.google_drive_json || "");
  const [driveFolderId, setDriveFolderId] = useState(settings.google_drive_folder_id || "");
  const [scriptUrl, setScriptUrl] = useState(settings.google_script_url || "");

  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<boolean | null>(null);
  const [testingAI, setTestingAI] = useState(false);
  const [aiStatus, setAiStatus] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingDrive, setTestingDrive] = useState(false);
  const [driveStatus, setDriveStatus] = useState<boolean | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveLogs, setDriveLogs] = useState<string[] | null>(null);
  const [testingScript, setTestingScript] = useState(false);
  const [scriptStatus, setScriptStatus] = useState<boolean | null>(null);
  const [showBotToken, setShowBotToken] = useState(false);
  const [showDriveJson, setShowDriveJson] = useState(false);

  const testTelegram = async () => {
    setTestingTelegram(true);
    // Save first
    await onSave([
      { setting_key: "telegram_bot_token", setting_value: botToken },
      { setting_key: "telegram_chat_id", setting_value: chatId },
    ]);
    const { data } = await supabase.functions.invoke("admin-data", { body: { action: "test_telegram" } });
    setTelegramStatus(data?.ok || false);
    setTestingTelegram(false);
    toast({ title: data?.ok ? "نجح الاتصال!" : "فشل الاتصال", description: data?.ok ? "تم إرسال رسالة تجريبية" : "تحقق من البيانات", variant: data?.ok ? "default" : "destructive" });
  };

  const testAI = async () => {
    setTestingAI(true);
    const { data } = await supabase.functions.invoke("admin-data", { body: { action: "test_ai" } });
    setAiStatus(data?.ok || false);
    setTestingAI(false);
    toast({ title: data?.ok ? "AI متصل!" : "AI غير متصل", variant: data?.ok ? "default" : "destructive" });
  };

  const testDrive = async () => {
    setTestingDrive(true);
    setDriveError(null);
    setDriveStatus(null);
    setDriveLogs(null);
    await onSave([
      { setting_key: "google_drive_json", setting_value: driveJson },
      { setting_key: "google_drive_folder_id", setting_value: driveFolderId },
    ]);
    const { data } = await supabase.functions.invoke("admin-data", {
      body: { action: "test_drive", data: { json_credentials: driveJson, folder_id: driveFolderId } },
    });
    setDriveStatus(data?.ok || false);
    if (!data?.ok) setDriveError(data?.error || "Unknown error");
    if (data?.details?.logs) setDriveLogs(data.details.logs);
    setTestingDrive(false);
    toast({
      title: data?.ok ? "Google Drive متصل!" : "فشل اتصال Drive",
      description: data?.ok ? `Folder: ${data.folder_name}` : data?.error,
      variant: data?.ok ? "default" : "destructive",
    });
  };

  const testScript = async () => {
    setTestingScript(true);
    setScriptStatus(null);
    const url = scriptUrl.trim();
    if (!url) {
      toast({ title: "خطأ", description: "أدخل رابط Google Apps Script أولاً", variant: "destructive" });
      setTestingScript(false);
      return;
    }
    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ type: "test", message: "Hello from Bashniny Admin" }),
      });
      // no-cors means we can't read the response, assume success
      setScriptStatus(true);
      toast({ title: "تم الإرسال!", description: "تم إرسال سجل تجريبي إلى Google Sheet — تحقق من الجدول" });
    } catch (e: any) {
      setScriptStatus(false);
      toast({ title: "فشل الإرسال", description: e.message, variant: "destructive" });
    } finally {
      setTestingScript(false);
    }
  };

  const saveAll = async () => {
    setSaving(true);
    await onSave([
      { setting_key: "telegram_bot_token", setting_value: botToken },
      { setting_key: "telegram_chat_id", setting_value: chatId },
      { setting_key: "active_model", setting_value: activeModel },
      { setting_key: "google_drive_json", setting_value: driveJson },
      { setting_key: "google_drive_folder_id", setting_value: driveFolderId },
      { setting_key: "google_script_url", setting_value: scriptUrl },
    ]);
    setSaving(false);
    toast({ title: "تم", description: "تم حفظ جميع الإعدادات" });
  };

  const StatusDot = ({ ok }: { ok: boolean | null }) => {
    if (ok === null) return null;
    return ok ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Telegram */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-arabic flex items-center gap-2">
            <Send className="h-4 w-4 text-blue-400" />
            تيليجرام
            {telegramStatus !== null && <StatusDot ok={telegramStatus} />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="block font-arabic text-xs text-muted-foreground mb-1">Bot Token</label>
            <div className="relative">
              <Input type={showBotToken ? "text" : "password"} value={botToken} onChange={(e) => setBotToken(e.target.value)} className="font-mono text-sm pr-9" dir="ltr" placeholder="123456:ABC-DEF..." />
              <button type="button" onClick={() => setShowBotToken(!showBotToken)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showBotToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block font-arabic text-xs text-muted-foreground mb-1">Chat ID</label>
            <Input value={chatId} onChange={(e) => setChatId(e.target.value)} className="font-mono text-sm" dir="ltr" placeholder="-100..." />
          </div>
          <Button onClick={testTelegram} disabled={testingTelegram || !botToken || !chatId} variant="outline" className="w-full font-arabic text-xs gap-1">
            {testingTelegram ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            اختبار الاتصال
          </Button>
        </CardContent>
      </Card>

      {/* AI Model */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-arabic flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            نموذج الذكاء الاصطناعي
            {aiStatus !== null && <StatusDot ok={aiStatus} />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="block font-arabic text-xs text-muted-foreground mb-1">النموذج النشط</label>
            <Select value={activeModel} onValueChange={setActiveModel}>
              <SelectTrigger className="font-mono text-sm" dir="ltr">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google/gemini-3-flash-preview">Gemini 3 Flash (سريع)</SelectItem>
                <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro (دقيق)</SelectItem>
                <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash (متوازن)</SelectItem>
                <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
                <SelectItem value="openai/gpt-5">GPT-5 (متقدم)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground font-arabic">يستخدم Lovable AI المدمج - لا حاجة لمفتاح API خارجي</p>
          <Button onClick={testAI} disabled={testingAI} variant="outline" className="w-full font-arabic text-xs gap-1">
            {testingAI ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
            فحص الاتصال
          </Button>
        </CardContent>
      </Card>

      {/* Google Drive */}
      <Card className="border-border/50 lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-arabic flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-emerald-400" />
            Google Drive (أرشفة الملفات)
            {driveStatus !== null && <StatusDot ok={driveStatus} />}
            {driveStatus === true && <Badge variant="outline" className="text-emerald-400 border-emerald-400/50 text-[10px]">Connected</Badge>}
            {driveStatus === false && <Badge variant="outline" className="text-destructive border-destructive/50 text-[10px]">Error</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block font-arabic text-xs text-muted-foreground mb-1 flex items-center gap-2">
                Service Account JSON
                <button type="button" onClick={() => setShowDriveJson(!showDriveJson)} className="text-muted-foreground hover:text-foreground">
                  {showDriveJson ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </label>
              {showDriveJson ? (
                <Textarea value={driveJson} onChange={(e) => setDriveJson(e.target.value)} className="font-mono text-xs" dir="ltr" rows={5} placeholder='{"type": "service_account", ...}' />
              ) : (
                <div className="bg-secondary/50 border border-border rounded-md p-3 font-mono text-xs text-muted-foreground" dir="ltr">
                  {driveJson ? "••••••••••••••••••••" : "لم يتم إدخال بيانات"}
                </div>
              )}
            </div>
            <div>
              <label className="block font-arabic text-xs text-muted-foreground mb-1">Folder ID</label>
              <Input value={driveFolderId} onChange={(e) => setDriveFolderId(e.target.value)} className="font-mono text-sm" dir="ltr" placeholder="1BxiMVs0XRA5nFMdKvBd..." />
              <p className="text-xs text-muted-foreground font-arabic mt-2">معرف المجلد من رابط Google Drive</p>
            </div>
          </div>
          {driveError && (
            <div className="space-y-2">
              <p className="text-xs text-destructive font-mono bg-destructive/10 p-2 rounded" dir="ltr">{driveError}</p>
            </div>
          )}
          {driveLogs && driveLogs.length > 0 && (
            <div className="bg-muted/30 border border-border/50 rounded p-2 space-y-0.5" dir="ltr">
              <p className="text-[10px] text-muted-foreground font-arabic mb-1">سجل التشخيص:</p>
              {driveLogs.map((log, i) => (
                <p key={i} className={`text-[11px] font-mono ${log.includes("error") || log.includes("Error") || log.includes("failed") || log.includes("Failed") ? "text-destructive" : "text-muted-foreground"}`}>{log}</p>
              ))}
            </div>
          )}
          {driveStatus === true && (
            <p className="text-xs text-emerald-400 font-arabic bg-emerald-400/10 p-2 rounded">✅ Google Drive is ready! Write access verified.</p>
          )}
          <Button onClick={testDrive} disabled={testingDrive || !driveJson || !driveFolderId} variant="outline" className="w-full font-arabic text-xs gap-1">
            {testingDrive ? <Loader2 className="h-3 w-3 animate-spin" /> : <HardDrive className="h-3 w-3" />}
            اختبار الاتصال
          </Button>
        </CardContent>
      </Card>

      {/* Google Apps Script */}
      <Card className="border-border/50 lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-arabic flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-amber-400" />
            Google Apps Script (جسر البيانات)
            {scriptStatus !== null && <StatusDot ok={scriptStatus} />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="block font-arabic text-xs text-muted-foreground mb-1">Web App URL</label>
            <Input value={scriptUrl} onChange={(e) => setScriptUrl(e.target.value)} className="font-mono text-sm" dir="ltr" placeholder="https://script.google.com/macros/s/.../exec" />
            <p className="text-xs text-muted-foreground font-arabic mt-2">رابط النشر لتطبيق Google Apps Script</p>
          </div>
          <Button onClick={testScript} disabled={testingScript || !scriptUrl.trim()} variant="outline" className="w-full font-arabic text-xs gap-1">
            {testingScript ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileCode2 className="h-3 w-3" />}
            اختبار الاتصال (إرسال سجل تجريبي)
          </Button>
        </CardContent>
      </Card>

      {/* Save All */}
      <div className="lg:col-span-2">
        <Button onClick={saveAll} disabled={saving} className="bg-gold-shimmer text-primary-foreground font-arabic glow-gold gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ جميع الإعدادات
        </Button>
      </div>
    </div>
  );
};

export default AdminIntegrations;
