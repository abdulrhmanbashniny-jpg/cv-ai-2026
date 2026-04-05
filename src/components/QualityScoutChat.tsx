import { Sparkles } from "lucide-react";
import UnifiedChatWindow from "@/components/UnifiedChatWindow";
import { useChatSession } from "@/hooks/useChatSession";
import { useLanguage } from "@/contexts/LanguageContext";

interface QualityScoutChatProps {
  serviceName: string;
  onClose: () => void;
}

const QualityScoutChat = ({ serviceName, onClose }: QualityScoutChatProps) => {
  const { t, lang } = useLanguage();

  const session = useChatSession({
    agentType: "quality_scout",
    disclaimerAr: `شكراً لاستخدامك خدمة "${serviceName}"! 🎉 أنا مدير نجاح العملاء في منصة الأستاذ عبدالرحمن سالم باشنيني.`,
    disclaimerEn: `Thank you for using "${serviceName}"! 🎉 I'm the Customer Success Manager at Abdulrahman Bashniny's platform.`,
    greetingFn: (name, l) => l === "ar"
      ? `مرحباً ${name}! أود سماع رأيك حول تجربتك. كيف تقيّم الخدمة التي حصلت عليها؟`
      : `Hello ${name}! I'd love to hear your feedback. How would you rate the service you received?`,
    lang,
  });

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[480px] max-h-[calc(100vh-4rem)] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
      <div className="h-full flex flex-col relative">
        <div className="absolute top-3 right-3 z-10">
          <button onClick={onClose} className="text-primary-foreground hover:opacity-80">
            <Sparkles className="h-5 w-5" />
          </button>
        </div>
        <UnifiedChatWindow
          session={session}
          headerTitle={t("كشاف الجودة والنمو", "Quality & Growth Scout")}
          headerIcon={<Sparkles className="h-5 w-5" />}
          accentColor="bg-gradient-to-r from-rose-500 to-amber-500"
          lang={lang}
          preChatTitle={t("بياناتك للتقييم", "Your info for feedback")}
          showFileUpload={false}
          className="h-full"
        />
      </div>
    </div>
  );
};

export default QualityScoutChat;
