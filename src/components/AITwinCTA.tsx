import { Bot, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const AITwinCTA = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-navy-deep relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="w-[500px] h-[500px] rounded-full bg-primary/30 blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-primary/30 bg-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-primary font-arabic text-sm font-medium">{t("تقنية الذكاء الاصطناعي", "AI Technology")}</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold font-arabic text-foreground mb-6 leading-tight">
            {t("تعرّف على", "Meet My")} <span className="text-gradient-gold">{t("توأمي الذكي", "AI Twin")}</span>
          </h2>

          <p className="text-lg text-muted-foreground font-arabic mb-4 max-w-2xl mx-auto leading-relaxed">
            {t(
              "هل لديك سؤال عن خبرتي القانونية أو قيادتي في الموارد البشرية؟ تحدث مع نسختي الذكية الآن واحصل على إجابات فورية مبنية على 15+ عامًا من الخبرة.",
              "Have a question about my legal expertise or HR leadership? Talk to my AI twin now and get instant answers based on 15+ years of experience."
            )}
          </p>

          <p className="text-muted-foreground font-arabic text-sm mb-8">
            {t(
              "يمكن للتوأم الذكي أيضاً تقديم استشارة مجانية في نظام العمل السعودي أو مساعدتك في كتابة سيرتك الذاتية باحترافية.",
              "The AI twin can also provide a free consultation on Saudi Labor Law or help you write a professional CV."
            )}
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => (window as any).__openFloatingChat?.()}
              className="bg-gold-shimmer text-primary-foreground font-arabic text-lg px-10 py-7 rounded-xl glow-gold hover:opacity-90 transition-opacity gap-2"
            >
              <Bot className="h-6 w-6" />
              {t("تحدث مع التوأم الذكي", "Talk to My AI Twin")}
            </Button>
            <a href="/career-gift">
              <Button
                variant="outline"
                size="lg"
                className="border-primary/40 text-primary font-arabic text-lg px-8 py-7 rounded-xl hover:bg-primary/10 transition-colors gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                {t("هدية CV مجانية", "Free CV Gift")}
              </Button>
            </a>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mt-10">
            {[
              t("استشارات نظام العمل", "Labor Law Consultations"),
              t("كتابة السيرة الذاتية", "CV Writing"),
              t("استفسارات مهنية", "Career Inquiries"),
              t("نصائح توظيف", "Hiring Tips"),
            ].map((f) => (
              <span key={f} className="px-4 py-2 rounded-full bg-card border border-border/50 text-xs font-arabic text-muted-foreground">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AITwinCTA;
