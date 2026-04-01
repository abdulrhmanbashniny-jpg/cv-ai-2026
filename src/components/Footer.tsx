import { useState, useEffect } from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import ContactModal from "@/components/ContactModal";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  const [footerEmail, setFooterEmail] = useState("info@bashniny.com");
  const [footerPhone, setFooterPhone] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.functions.invoke("admin-data", { body: { table: "admin_settings" } });
        const settings = data?.data || [];
        const get = (key: string) => settings.find((s: any) => s.setting_key === key)?.setting_value;
        if (get("footer_email")) setFooterEmail(get("footer_email"));
        if (get("footer_phone")) setFooterPhone(get("footer_phone"));
      } catch { /* use defaults */ }
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-navy-deep border-t border-border py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-2xl font-bold font-arabic text-foreground mb-4">
              {t("عبدالرحمن", "Abdulrahman")} <span className="text-primary">{t("باشنيني", "Bashniny")}</span>
            </h3>
            <p className="text-muted-foreground font-arabic text-sm leading-relaxed">
              {t(
                "مدير أول الموارد البشرية والشؤون القانونية. متخصص في تقديم الاستشارات المهنية وبناء بيئات عمل احترافية.",
                "Senior HR & Legal Affairs Director. Specialized in professional consultations and building professional work environments."
              )}
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold font-arabic text-foreground mb-4">{t("روابط سريعة", "Quick Links")}</h4>
            <ul className="space-y-3 font-arabic text-sm">
              <li><a href="/" className="text-muted-foreground hover:text-primary transition-colors">{t("الرئيسية", "Home")}</a></li>
              <li><a href="/careers" className="text-muted-foreground hover:text-primary transition-colors">{t("بوابة التوظيف", "Careers Portal")}</a></li>
              <li><a href="/consultation" className="text-muted-foreground hover:text-primary transition-colors">{t("الاستشارات الذكية", "Smart Consultations")}</a></li>
              <li><a href="/career-gift" className="text-muted-foreground hover:text-primary transition-colors">{t("هدية السيرة الذاتية", "CV Gift")}</a></li>
              <li><a href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">{t("سياسة الخصوصية", "Privacy Policy")}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold font-arabic text-foreground mb-4">{t("تواصل معنا", "Contact Us")}</h4>
            <ul className="space-y-3 font-arabic text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{t("المملكة العربية السعودية", "Saudi Arabia")}</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>{footerEmail}</span>
              </li>
              {footerPhone && (
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary" />
                  <span dir="ltr">{footerPhone}</span>
                </li>
              )}
            </ul>
            <div className="mt-4">
              <ContactModal />
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground font-arabic text-sm">
            © {new Date().getFullYear()} {t("عبدالرحمن باشنيني. جميع الحقوق محفوظة.", "Abdulrahman Bashniny. All rights reserved.")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
