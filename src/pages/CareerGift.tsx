import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Gift } from "lucide-react";
import UnifiedChatWindow from "@/components/UnifiedChatWindow";
import { useChatSession } from "@/hooks/useChatSession";

const CareerGift = () => {
  const session = useChatSession({
    agentType: "cv_assistant",
    disclaimerAr: "تنويه هام: هذا المساعد الذكي أداة استرشادية لتقديم معلومات عامة ولا يُغني عن الاستشارة المهنية المباشرة. استخدامك للدردشة يُعد موافقة صريحة وإخلاءً لمسؤولية المنصة.",
    disclaimerEn: "Important Notice: This AI assistant is a guidance tool. By using this chat, you agree to the platform's disclaimer.",
    greetingFn: (name, l) => l === "ar"
      ? `مرحباً ${name}! 🎁 أنا مساعد كتابة السيرة الذاتية من فريق الأستاذ عبدالرحمن باشنيني.\n\nسأساعدك في بناء سيرة ذاتية احترافية بمعايير الموارد البشرية — مجاناً تماماً!\n\nلنبدأ: **ما هو المسمى الوظيفي الذي تستهدفه؟**`
      : `Hello ${name}! 🎁 I'm the CV Writing Assistant from Mr. Abdulrahman Bashniny's team.\n\nI'll help you build a professional CV with HR standards — completely free!\n\nLet's start: **What job title are you targeting?**`,
    lang: "ar",
  });

  return (
    <div dir="rtl" className="min-h-screen">
      <Navbar />
      <section className="pt-24 pb-16 min-h-screen bg-navy-gradient">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-full border border-primary/30 bg-primary/5">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-primary font-arabic text-sm">هدية مجانية</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-arabic text-foreground mb-2">
              مساعد كتابة <span className="text-gradient-gold">السيرة الذاتية</span>
            </h1>
            <p className="text-muted-foreground font-arabic">
              دع الذكاء الاصطناعي يساعدك في بناء CV احترافي بمعايير HR
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ height: "65vh" }}>
            <UnifiedChatWindow
              session={session}
              headerTitle="مساعد CV المجاني"
              headerIcon={<Gift className="h-5 w-5" />}
              accentColor="bg-primary"
              lang="ar"
              preChatTitle="بياناتك لبدء بناء السيرة الذاتية"
              className="h-full"
            />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default CareerGift;
