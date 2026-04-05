import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UnifiedChatWindow from "@/components/UnifiedChatWindow";
import { useChatSession } from "@/hooks/useChatSession";

const categories = [
  "نظام العمل السعودي",
  "عقود العمل",
  "الفصل والإنهاء",
  "الإجازات والمستحقات",
  "التأمينات الاجتماعية",
  "نظام حماية الأجور",
  "سياسات الموارد البشرية",
  "أخرى",
];

const Consultation = () => {
  const [category, setCategory] = useState("");

  const session = useChatSession({
    agentType: "legal_advisor",
    disclaimerAr: "تنويه هام: هذا المساعد الذكي أداة استرشادية لتقديم معلومات عامة ولا يُغني عن الاستشارة المهنية أو القانونية المباشرة. استخدامك للدردشة يُعد موافقة صريحة وإخلاءً لمسؤولية المنصة.",
    disclaimerEn: "Important Notice: This AI assistant is a guidance tool. By using this chat, you agree to the platform's disclaimer.",
    greetingFn: (name, l) => l === "ar"
      ? `مرحباً ${name}! أنا المستشار القانوني الذكي للأستاذ عبدالرحمن باشنيني.\n\nكيف يمكنني مساعدتك في موضوع "${category || "الاستشارة"}"؟ يرجى وصف مشكلتك بالتفصيل.`
      : `Hello ${name}! I'm the AI Legal Advisor for Mr. Abdulrahman Bashniny.\n\nHow can I help you with "${category || "consultation"}"? Please describe your issue in detail.`,
    lang: "ar",
  });

  const categoryField = (
    <div>
      <label className="block font-arabic text-xs text-muted-foreground mb-1">فئة الاستشارة *</label>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="text-right font-arabic"><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
        <SelectContent>{categories.map((c) => <SelectItem key={c} value={c} className="font-arabic">{c}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen">
      <Navbar />
      <section className="pt-24 pb-16 min-h-screen bg-navy-gradient">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold font-arabic text-foreground mb-4">
              المستشار <span className="text-gradient-gold">العمالي</span>
            </h1>
            <p className="text-muted-foreground font-arabic">
              احصل على استشارة فورية في نظام العمل والموارد البشرية
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ height: "65vh" }}>
            <UnifiedChatWindow
              session={session}
              headerTitle="المستشار العمالي الذكي"
              accentColor="bg-primary"
              lang="ar"
              preChatTitle="بيانات الاستشارة"
              preChatExtraFields={categoryField}
              className="h-full"
            />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Consultation;
