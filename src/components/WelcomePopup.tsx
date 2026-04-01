import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const POPUP_KEY = "welcome_popup_dismissed_at";

const WelcomePopup = () => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [link, setLink] = useState("/templates");

  useEffect(() => {
    // Check 24h cooldown
    const dismissed = localStorage.getItem(POPUP_KEY);
    if (dismissed) {
      const diff = Date.now() - parseInt(dismissed);
      if (diff < 24 * 60 * 60 * 1000) return;
    }

    const load = async () => {
      try {
        const { data } = await supabase.functions.invoke("admin-data", { body: { table: "admin_settings" } });
        const settings = data?.data || [];
        const active = settings.find((s: any) => s.setting_key === "popup_active")?.setting_value === "true";
        const t = settings.find((s: any) => s.setting_key === "popup_title")?.setting_value || "";
        const img = settings.find((s: any) => s.setting_key === "popup_image")?.setting_value || "";
        const l = settings.find((s: any) => s.setting_key === "popup_link")?.setting_value || "/templates";
        if (active && t) {
          setTitle(t);
          setImage(img);
          setLink(l);
          setTimeout(() => setOpen(true), 2000);
        }
      } catch {}
    };
    load();
  }, []);

  const dismiss = () => {
    setOpen(false);
    localStorage.setItem(POPUP_KEY, String(Date.now()));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent className="sm:max-w-sm text-center p-0 overflow-hidden" dir="rtl">
        <button onClick={dismiss} className="absolute top-3 right-3 z-10 bg-background/80 rounded-full p-1 hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
        {image && (
          <div className="w-full h-48 overflow-hidden">
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6 space-y-4">
          <h3 className="font-arabic font-bold text-lg">{title}</h3>
          <Button asChild className="w-full bg-gold-shimmer text-primary-foreground font-arabic">
            <a href={link}>{t("اكتشف الآن", "Discover Now")}</a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePopup;
