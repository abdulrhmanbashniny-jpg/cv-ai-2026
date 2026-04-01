import heroPortrait from "@/assets/hero-portrait.jpg";
import { Button } from "@/components/ui/button";
import { MessageCircle, FileText, Briefcase, Award, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
  const { t, lang } = useLanguage();
  const [heroImageUrl, setHeroImageUrl] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.functions.invoke("admin-data", { body: { table: "admin_settings" } });
        const settings = data?.data || [];
        const get = (key: string) => settings.find((s: any) => s.setting_key === key)?.setting_value;
        if (get("hero_image_url")) setHeroImageUrl(get("hero_image_url"));
      } catch { /* use defaults */ }
    };
    fetchSettings();
  }, []);

  const firstName = t("عبدالرحمن", "Abdulrahman");
  const lastName = t("باشنيني", "Bashniny");
  const portraitSrc = heroImageUrl || heroPortrait;

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-navy-gradient">
      <div className="absolute top-0 left-0 w-full h-full opacity-5">
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full border border-primary/30" />
        <div className="absolute bottom-20 left-20 w-64 h-64 rounded-full border border-primary/20" />
      </div>

      <div className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className={`order-2 lg:order-1 animate-fade-in-up ${lang === "ar" ? "text-right" : "text-left"}`}>
            <div className="inline-block mb-6 px-4 py-2 rounded-full border border-primary/30 bg-primary/5">
              <span className="text-primary font-arabic text-sm">
                {t("+15 عامًا من الخبرة في الموارد البشرية والشؤون القانونية", "+15 Years of HR & Legal Affairs Experience")}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-arabic leading-tight mb-6">
              <span className="text-foreground">{firstName}</span>
              <br />
              <span className="text-gradient-gold">{lastName}</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground font-arabic mb-3">
              {t("مدير تطوير الأعمال | مدير أول الموارد البشرية والشؤون القانونية", "Business Development Manager | Senior HR & Legal Affairs Director")}
            </p>

            <div className={`flex flex-wrap gap-3 mb-6 ${lang === "ar" ? "justify-end" : "justify-start"}`}>
              <span className="inline-flex items-center gap-1.5 text-xs font-arabic text-muted-foreground bg-card/60 px-3 py-1.5 rounded-full border border-border/50">
                <Award className="h-3.5 w-3.5 text-primary" />
                {t("خبير نظام العمل السعودي", "Saudi Labor Law Expert")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-arabic text-muted-foreground bg-card/60 px-3 py-1.5 rounded-full border border-border/50">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {t("جدة، المملكة العربية السعودية", "Jeddah, Saudi Arabia")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-arabic text-muted-foreground bg-card/60 px-3 py-1.5 rounded-full border border-border/50">
                <Briefcase className="h-3.5 w-3.5 text-primary" />
                {t("راديسون بلو • الأغذية العربية • نجوم الحفل • دهانات جدة", "Radisson Blu • Arab Catering • Nojoom Al-Hafl • Jeddah Paints")}
              </span>
            </div>
            
            <p className={`text-muted-foreground font-arabic leading-relaxed mb-8 max-w-lg ${lang === "ar" ? "mr-auto text-right" : "ml-auto text-left"}`}>
              {t(
                "متخصص في بناء بيئات عمل احترافية، وتطوير السياسات التنظيمية، وتقديم الاستشارات في نظام العمل السعودي والأنظمة ذات العلاقة. بكالوريوس إدارة موارد بشرية من جامعة الملك عبدالعزيز، ورخصة استشارات عمالية معتمدة.",
                "Specialized in building professional work environments, developing organizational policies, and providing consultations on Saudi Labor Law. Bachelor's in HR Management from King Abdulaziz University, with a certified labor consultancy license."
              )}
            </p>

            <div className={`flex flex-wrap gap-4 ${lang === "ar" ? "justify-end" : "justify-start"}`}>
              <Button 
                size="lg" 
                onClick={() => (window as any).__openFloatingChat?.()}
                className="bg-gold-shimmer text-primary-foreground font-arabic text-lg px-8 py-6 rounded-lg glow-gold hover:opacity-90 transition-opacity"
              >
                <MessageCircle className={`h-5 w-5 ${lang === "ar" ? "ml-2" : "mr-2"}`} />
                {t("استشر توأمي الرقمي", "Ask My AI Twin")}
              </Button>
              <a href="/consultation">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-primary/40 text-primary font-arabic text-lg px-8 py-6 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <FileText className={`h-5 w-5 ${lang === "ar" ? "ml-2" : "mr-2"}`} />
                  {t("طلب استشارة رسمية", "Request Consultation")}
                </Button>
              </a>
            </div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center animate-slide-in-right">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-primary/40 to-primary/10 rounded-2xl blur-sm" />
              <div className="relative w-80 h-96 md:w-96 md:h-[28rem] rounded-2xl overflow-hidden border-2 border-primary/20">
                <img
                  src={portraitSrc}
                  alt={`${firstName} ${lastName}`}
                  className="w-full h-full object-cover object-top"
                  width={800}
                  height={1024}
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-card border border-primary/30 rounded-xl px-5 py-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <span className="font-arabic text-sm text-foreground font-semibold">
                    {t("مدير تطوير الأعمال", "Business Development Manager")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
