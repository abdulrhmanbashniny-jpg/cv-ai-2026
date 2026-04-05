import { useState, useEffect } from "react";
import { MessageCircle, X, Bot } from "lucide-react";
import UnifiedChatWindow from "@/components/UnifiedChatWindow";
import { useChatSession } from "@/hooks/useChatSession";
import { useLanguage } from "@/contexts/LanguageContext";

const FloatingAIChat = () => {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);

  const session = useChatSession({
    agentType: "career_twin",
    disclaimerAr: "تنويه هام: هذا المساعد الذكي أداة استرشادية لتقديم معلومات عامة ولا يُغني عن الاستشارة المهنية أو القانونية المباشرة. استخدامك للدردشة يُعد موافقة صريحة وإخلاءً لمسؤولية المنصة.",
    disclaimerEn: "Important Notice: This AI assistant is a guidance tool providing general information and does not replace professional or legal consultation. By using this chat, you agree to the platform's disclaimer.",
    greetingFn: (name, l) => l === "ar"
      ? `مرحباً ${name}! أنا عبدالرحمن سالم باشنيني، مدير تطوير الأعمال. كيف يمكنني مساعدتك اليوم؟`
      : `Hello ${name}! I'm Abdulrahman Salem Bashniny, Business Development Manager. How can I help you today?`,
    lang,
  });

  useEffect(() => {
    session.resetDisclaimer();
  }, [lang]);

  useEffect(() => {
    (window as any).__openFloatingChat = () => setOpen(true);
    return () => { delete (window as any).__openFloatingChat; };
  }, []);

  const ctaText = t("اسأل توأمي الرقمي عن خبراتي 💬", "Ask My AI Twin 💬");

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform glow-gold px-5 py-3"
          aria-label={ctaText}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="font-arabic text-sm font-semibold hidden sm:inline">{ctaText}</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 left-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-4rem)] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
          <div className="h-full flex flex-col">
            {/* Close button overlay */}
            <div className="absolute top-3 right-3 z-10">
              <button onClick={() => setOpen(false)} className="text-primary-foreground hover:opacity-80">
                <X className="h-5 w-5" />
              </button>
            </div>
            <UnifiedChatWindow
              session={session}
              headerTitle={t("المساعد الذكي", "AI Assistant")}
              headerIcon={<Bot className="h-5 w-5" />}
              accentColor="bg-primary"
              lang={lang}
              preChatTitle={t("قبل أن نبدأ", "Before we begin")}
              className="h-full"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAIChat;
