import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Megaphone, Save, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AdminAdsManagerProps {
  settings: Record<string, string>;
  onSave: (data: { setting_key: string; setting_value: string }[]) => Promise<void>;
}

const AdminAdsManager = ({ settings, onSave }: AdminAdsManagerProps) => {
  const [promoActive, setPromoActive] = useState(settings.promo_bar_active === "true");
  const [promoText, setPromoText] = useState(settings.promo_bar_text || "");
  const [promoLink, setPromoLink] = useState(settings.promo_bar_link || "/templates");
  const [popupActive, setPopupActive] = useState(settings.popup_active === "true");
  const [popupTitle, setPopupTitle] = useState(settings.popup_title || "");
  const [popupImage, setPopupImage] = useState(settings.popup_image || "");
  const [popupLink, setPopupLink] = useState(settings.popup_link || "/templates");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPromoActive(settings.promo_bar_active === "true");
    setPromoText(settings.promo_bar_text || "");
    setPromoLink(settings.promo_bar_link || "/templates");
    setPopupActive(settings.popup_active === "true");
    setPopupTitle(settings.popup_title || "");
    setPopupImage(settings.popup_image || "");
    setPopupLink(settings.popup_link || "/templates");
  }, [settings]);

  const save = async () => {
    setSaving(true);
    await onSave([
      { setting_key: "promo_bar_active", setting_value: String(promoActive) },
      { setting_key: "promo_bar_text", setting_value: promoText },
      { setting_key: "promo_bar_link", setting_value: promoLink },
      { setting_key: "popup_active", setting_value: String(popupActive) },
      { setting_key: "popup_title", setting_value: popupTitle },
      { setting_key: "popup_image", setting_value: popupImage },
      { setting_key: "popup_link", setting_value: popupLink },
    ]);
    setSaving(false);
    toast({ title: "تم", description: "تم حفظ إعدادات الإعلانات" });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold font-arabic flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-primary" />
        مدير الإعلانات
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Promo Bar */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-arabic">شريط الإعلان العلوي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="promo-toggle" className="font-arabic text-sm cursor-pointer">{promoActive ? "مفعّل" : "معطّل"}</Label>
              <Switch id="promo-toggle" checked={promoActive} onCheckedChange={setPromoActive} />
            </div>
            <div>
              <label className="block font-arabic text-xs text-muted-foreground mb-1">نص الإعلان</label>
              <Input value={promoText} onChange={(e) => setPromoText(e.target.value)} className="font-arabic text-right" />
            </div>
            <div>
              <label className="block font-arabic text-xs text-muted-foreground mb-1">الرابط</label>
              <Input value={promoLink} onChange={(e) => setPromoLink(e.target.value)} className="text-left" dir="ltr" />
            </div>
          </CardContent>
        </Card>

        {/* Welcome Popup */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-arabic">النافذة المنبثقة الترحيبية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="popup-toggle" className="font-arabic text-sm cursor-pointer">{popupActive ? "مفعّل" : "معطّل"}</Label>
              <Switch id="popup-toggle" checked={popupActive} onCheckedChange={setPopupActive} />
            </div>
            <div>
              <label className="block font-arabic text-xs text-muted-foreground mb-1">العنوان</label>
              <Input value={popupTitle} onChange={(e) => setPopupTitle(e.target.value)} className="font-arabic text-right" />
            </div>
            <div>
              <label className="block font-arabic text-xs text-muted-foreground mb-1">رابط الصورة</label>
              <Input value={popupImage} onChange={(e) => setPopupImage(e.target.value)} className="text-left" dir="ltr" placeholder="https://..." />
            </div>
            <div>
              <label className="block font-arabic text-xs text-muted-foreground mb-1">الرابط</label>
              <Input value={popupLink} onChange={(e) => setPopupLink(e.target.value)} className="text-left" dir="ltr" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={save} disabled={saving} className="bg-gold-shimmer text-primary-foreground font-arabic gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        حفظ الإعدادات
      </Button>
    </div>
  );
};

export default AdminAdsManager;
