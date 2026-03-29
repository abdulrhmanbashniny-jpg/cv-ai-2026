import heroPortrait from "@/assets/hero-portrait.jpg";
import { Button } from "@/components/ui/button";
import { MessageCircle, FileText, Briefcase } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-navy-gradient">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5">
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full border border-primary/30" />
        <div className="absolute bottom-20 left-20 w-64 h-64 rounded-full border border-primary/20" />
      </div>

      <div className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-right order-2 lg:order-1 animate-fade-in-up">
            <div className="inline-block mb-6 px-4 py-2 rounded-full border border-primary/30 bg-primary/5">
              <span className="text-primary font-arabic text-sm">
                +15 عامًا من الخبرة في الموارد البشرية والشؤون القانونية
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-arabic leading-tight mb-6">
              <span className="text-foreground">عبدالرحمن</span>
              <br />
              <span className="text-gradient-gold">باشنيني</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground font-arabic mb-4">
              مدير أول الموارد البشرية والشؤون القانونية
            </p>
            
            <p className="text-muted-foreground font-arabic leading-relaxed mb-10 max-w-lg mr-auto text-right">
              متخصص في بناء بيئات عمل احترافية، وتطوير السياسات التنظيمية، 
              وتقديم الاستشارات في نظام العمل السعودي والأنظمة ذات العلاقة.
            </p>

            <div className="flex flex-wrap gap-4 justify-end">
              <Button 
                size="lg" 
                className="bg-gold-shimmer text-primary-foreground font-arabic text-lg px-8 py-6 rounded-lg glow-gold hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="ml-2 h-5 w-5" />
                تحدث مع المساعد الذكي
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-primary/40 text-primary font-arabic text-lg px-8 py-6 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <FileText className="ml-2 h-5 w-5" />
                تحميل السيرة الذاتية
              </Button>
            </div>
          </div>

          {/* Portrait */}
          <div className="order-1 lg:order-2 flex justify-center animate-slide-in-right">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-primary/40 to-primary/10 rounded-2xl blur-sm" />
              <div className="relative w-80 h-96 md:w-96 md:h-[28rem] rounded-2xl overflow-hidden border-2 border-primary/20">
                <img
                  src={heroPortrait}
                  alt="عبدالرحمن باشنيني"
                  className="w-full h-full object-cover object-top"
                  width={800}
                  height={1024}
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-card border border-primary/30 rounded-xl px-5 py-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <span className="font-arabic text-sm text-foreground font-semibold">مدير أول HR & Legal</span>
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
