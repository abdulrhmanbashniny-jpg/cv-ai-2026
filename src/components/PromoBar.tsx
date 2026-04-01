import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const PromoBar = () => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("");
  const [link, setLink] = useState("/templates");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.functions.invoke("admin-data", { body: { table: "admin_settings" } });
        const settings = data?.data || [];
        const active = settings.find((s: any) => s.setting_key === "promo_bar_active")?.setting_value === "true";
        const t = settings.find((s: any) => s.setting_key === "promo_bar_text")?.setting_value || "";
        const l = settings.find((s: any) => s.setting_key === "promo_bar_link")?.setting_value || "/templates";
        if (active && t) {
          setText(t);
          setLink(l);
          setVisible(true);
        }
      } catch {}
    };
    load();
  }, []);

  if (!visible || dismissed) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-primary text-primary-foreground py-2 px-4 text-center animate-fade-in-up">
      <div className="container mx-auto flex items-center justify-center gap-3">
        <a href={link} className="font-arabic text-sm font-semibold hover:underline flex-1">
          {text}
        </a>
        <button onClick={() => setDismissed(true)} className="hover:opacity-70 shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PromoBar;
