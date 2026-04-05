import { Sparkles } from "lucide-react";
import UnifiedChatWindow from "@/components/UnifiedChatWindow";
import { useChatSession } from "@/hooks/useChatSession";
import { useLanguage } from "@/contexts/LanguageContext";

const TemplateArchitectChat = () => {
  const { t, lang } = useLanguage();

  const session = useChatSession({
    agentType: "template_architect",
    disclaimerAr: "تنويه هام: هذا المساعد الذكي أداة استرشادية لتقديم معلومات عامة ولا يُغني عن الاستشارة المهنية المباشرة. استخدامك للدردشة يُعد موافقة صريحة وإخلاءً لمسؤولية المنصة.",
    disclaimerEn: "Important Notice: This AI assistant is a guidance tool providing general information. By using this chat, you agree to the platform's disclaimer.",
    greetingFn: (name, l) => l === "ar"
      ? `أهلاً بك ${name}! أنا مساعد النماذج والتصميم. كيف يمكنني مساعدتك في إيجاد أو تصميم النموذج الإداري المناسب لك؟`
      : `Welcome ${name}! I'm the Template & Design Architect. How can I help you find or design the right administrative template?`,
    lang,
  });

  return (
    <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl overflow-hidden" style={{ height: "480px" }}>
      <UnifiedChatWindow
        session={session}
        headerTitle={t("مساعد النماذج والتصميم", "Template & Design Architect")}
        headerIcon={<Sparkles className="h-5 w-5" />}
        accentColor="bg-primary"
        lang={lang}
        preChatTitle={t("بياناتك قبل البدء", "Your info before starting")}
        className="h-full"
      />
    </div>
  );
};

export default TemplateArchitectChat;
