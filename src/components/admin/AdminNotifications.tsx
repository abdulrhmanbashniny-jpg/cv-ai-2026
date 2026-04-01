import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AdminNotifications = () => {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke("admin-data", { body: { table: "notification_settings" } });
    setSettings(data?.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id: string, currentVal: boolean) => {
    setToggling(id);
    await supabase.functions.invoke("admin-data", {
      body: { action: "update", table: "notification_settings", id, data: { is_enabled: !currentVal } },
    });
    setSettings((prev) => prev.map((s) => s.id === id ? { ...s, is_enabled: !currentVal } : s));
    toast({ title: "تم", description: "تم تحديث الإعداد" });
    setToggling(null);
  };

  return (
    <Card className="border-border/50 max-w-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-arabic flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" /> إعدادات تنبيهات Telegram
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4">
            {settings.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={s.is_enabled}
                    onCheckedChange={() => toggle(s.id, s.is_enabled)}
                    disabled={toggling === s.id}
                    id={s.id}
                  />
                  {toggling === s.id && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                </div>
                <Label htmlFor={s.id} className="font-arabic text-sm cursor-pointer">{s.event_label}</Label>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminNotifications;
