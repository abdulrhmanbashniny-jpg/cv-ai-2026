import { useEffect } from "react";
import { Send, Bot, User, Loader2, Paperclip, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import PreChatForm from "@/components/PreChatForm";
import QualitySurvey from "@/components/QualitySurvey";
import type { Msg } from "@/hooks/useChatSession";
import type { useChatSession } from "@/hooks/useChatSession";

type ChatSession = ReturnType<typeof useChatSession>;

interface UnifiedChatWindowProps {
  session: ChatSession;
  headerTitle: string;
  headerIcon?: React.ReactNode;
  accentColor?: string;
  lang: string;
  preChatTitle?: string;
  preChatExtraFields?: React.ReactNode;
  showFileUpload?: boolean;
  className?: string;
}

const UnifiedChatWindow = ({
  session,
  headerTitle,
  headerIcon,
  accentColor = "bg-primary",
  lang,
  preChatTitle,
  preChatExtraFields,
  showFileUpload = true,
  className = "",
}: UnifiedChatWindowProps) => {
  const {
    visitor,
    messages,
    input,
    setInput,
    isLoading,
    uploadingFile,
    ending,
    ended,
    showSurvey,
    chatEndRef,
    fileInputRef,
    initSession,
    sendMessage,
    handleFileUpload,
    triggerEndFlow,
    submitSurveyAndEnd,
    skipSurveyAndEnd,
    t,
  } = session;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Pre-chat gate
  if (!visitor) {
    return (
      <div className={`flex items-center justify-center p-6 ${className}`}>
        <PreChatForm
          onSubmit={(data) => initSession(data)}
          title={preChatTitle}
          extraFields={preChatExtraFields}
        />
      </div>
    );
  }

  // Survey overlay
  if (showSurvey) {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className={`flex items-center justify-between px-4 py-3 ${accentColor} text-primary-foreground`}>
          <div className="flex items-center gap-2">
            {headerIcon || <Bot className="h-5 w-5" />}
            <span className="font-arabic font-semibold text-sm">{headerTitle}</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <QualitySurvey
            onSubmit={submitSurveyAndEnd}
            onSkip={skipSurveyAndEnd}
            loading={ending}
            lang={lang}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 ${accentColor} text-primary-foreground`}>
        <div className="flex items-center gap-2">
          {headerIcon || <Bot className="h-5 w-5" />}
          <span className="font-arabic font-semibold text-sm">{headerTitle}</span>
        </div>
        <Bot className="h-5 w-5 opacity-70" />
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="space-y-3">
          {messages.map((msg: Msg, i: number) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "assistant" ? "bg-primary/20 text-primary" : "bg-secondary text-foreground"}`}>
                {msg.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              </div>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm font-arabic leading-relaxed ${msg.role === "assistant" ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"}`}>
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="bg-secondary rounded-xl px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t border-border space-y-2">
        {messages.length >= 4 && !ended && (
          <Button
            onClick={triggerEndFlow}
            disabled={ending || isLoading}
            variant="outline"
            size="sm"
            className="w-full font-arabic text-xs gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            {ending ? <Loader2 className="h-3 w-3 animate-spin" /> : <PhoneOff className="h-3 w-3" />}
            {t("إنهاء المحادثة وإرسال التقرير", "End Conversation & Send Report")}
          </Button>
        )}
        {!ended ? (
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2" dir={lang === "ar" ? "rtl" : "ltr"}>
            {showFileUpload && (
              <>
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); e.target.value = ""; }} />
                <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isLoading || uploadingFile} className="text-muted-foreground hover:text-primary shrink-0">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </>
            )}
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("اكتب رسالتك...", "Type your message...")} className="flex-1 text-sm font-arabic" disabled={isLoading} />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-primary text-primary-foreground">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <p className="text-center text-xs text-muted-foreground font-arabic py-2">
            {t("تم إنهاء المحادثة. شكراً لك!", "Conversation ended. Thank you!")}
          </p>
        )}
      </div>
    </div>
  );
};

export default UnifiedChatWindow;
