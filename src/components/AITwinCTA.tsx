import { Bot, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const AITwinCTA = () => {
  return (
    <section className="py-20 bg-navy-deep relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="w-[500px] h-[500px] rounded-full bg-primary/30 blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-primary/30 bg-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-primary font-arabic text-sm font-medium">تقنية الذكاء الاصطناعي</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold font-arabic text-foreground mb-6 leading-tight">
            تعرّف على <span className="text-gradient-gold">توأمي الذكي</span>
          </h2>

          <p className="text-lg text-muted-foreground font-arabic mb-4 max-w-2xl mx-auto leading-relaxed">
            هل لديك سؤال عن خبرتي القانونية أو قيادتي في الموارد البشرية؟
            تحدث مع نسختي الذكية الآن واحصل على إجابات فورية مبنية على 15+ عامًا من الخبرة.
          </p>

          <p className="text-muted-foreground font-arabic text-sm mb-8">
            يمكن للتوأم الذكي أيضاً تقديم استشارة مجانية في نظام العمل السعودي 
            أو مساعدتك في كتابة سيرتك الذاتية باحترافية.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <a href="/consultation">
              <Button
                size="lg"
                className="bg-gold-shimmer text-primary-foreground font-arabic text-lg px-10 py-7 rounded-xl glow-gold hover:opacity-90 transition-opacity gap-2"
              >
                <Bot className="h-6 w-6" />
                تحدث مع التوأم الذكي
              </Button>
            </a>
            <a href="/career-gift">
              <Button
                variant="outline"
                size="lg"
                className="border-primary/40 text-primary font-arabic text-lg px-8 py-7 rounded-xl hover:bg-primary/10 transition-colors gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                هدية CV مجانية
              </Button>
            </a>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 justify-center mt-10">
            {["استشارات نظام العمل", "كتابة السيرة الذاتية", "استفسارات مهنية", "نصائح توظيف"].map((f) => (
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
