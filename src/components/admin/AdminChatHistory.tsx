import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Bot, User, Edit3, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface AdminChatHistoryProps {
  chatLogs: any[];
  consultations: any[];
  onRefresh: () => void;
}

const AdminChatHistory = ({ chatLogs, consultations, onRefresh }: AdminChatHistoryProps) => {
  const [selectedConsultation, setSelectedConsultation] = useState<string | null>(null);
  const [correcting, setCorrecting] = useState<string | null>(null);
  const [correction, setCorrection] = useState("");
  const [saving, setSaving] = useState(false);

  // Group chat logs by consultation_id
  const grouped = chatLogs.reduce((acc: Record<string, any[]>, log: any) => {
    const key = log.consultation_id || "no_session";
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  const sessionIds = Object.keys(grouped).filter((k) => k !== "no_session");
  const orphanLogs = grouped["no_session"] || [];

  const activeLogs = selectedConsultation
    ? (grouped[selectedConsultation] || []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  const getConsultationInfo = (id: string) => consultations.find((c: any) => c.id === id);

  const submitCorrection = async (logId: string) => {
    if (!correction.trim()) return;
    setSaving(true);

    // Save correction as a knowledge base entry
    await supabase.functions.invoke("admin-data", {
      body: {
        action: "insert",
        table: "ai_knowledge_base",
        data: {
          question: `تصحيح للإجابة في المحادثة ${logId}`,
          answer: correction,
          category: "تصحيحات",
        },
      },
    });

    toast({ title: "تم", description: "تم حفظ التصحيح في قاعدة المعرفة" });
    setCorrecting(null);
    setCorrection("");
    setSaving(false);
    onRefresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sessions List */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-arabic flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            جلسات المحادثة ({sessionIds.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="space-y-1 p-3">
              {sessionIds.length === 0 && (
                <p className="text-muted-foreground font-arabic text-sm text-center py-8">لا توجد جلسات</p>
              )}
              {sessionIds.map((sid) => {
                const info = getConsultationInfo(sid);
                const logs = grouped[sid];
                return (
                  <button
                    key={sid}
                    onClick={() => setSelectedConsultation(sid)}
                    className={`w-full text-right p-3 rounded-lg border transition-colors ${
                      selectedConsultation === sid
                        ? "border-primary/50 bg-primary/10"
                        : "border-transparent hover:bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {logs.length} رسالة
                      </Badge>
                      <span className="font-arabic text-sm font-medium text-foreground">
                        {info?.visitor_name || "زائر"}
                      </span>
                    </div>
                    {info && (
                      <p className="text-xs text-muted-foreground font-arabic">{info.issue_category}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(logs[0]?.created_at).toLocaleDateString("ar-SA")}
                    </p>
                  </button>
                );
              })}

              {orphanLogs.length > 0 && (
                <button
                  onClick={() => setSelectedConsultation("no_session")}
                  className={`w-full text-right p-3 rounded-lg border transition-colors ${
                    selectedConsultation === "no_session"
                      ? "border-primary/50 bg-primary/10"
                      : "border-transparent hover:bg-secondary/30"
                  }`}
                >
                  <span className="font-arabic text-sm text-muted-foreground">رسائل بدون جلسة ({orphanLogs.length})</span>
                </button>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Transcript */}
      <Card className="border-border/50 lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-arabic flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            المحادثة الكاملة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 p-4">
              {!selectedConsultation && (
                <p className="text-muted-foreground font-arabic text-sm text-center py-16">اختر جلسة من القائمة لعرض المحادثة</p>
              )}
              {(selectedConsultation === "no_session" ? orphanLogs : activeLogs).map((log: any) => (
                <div key={log.id} className={`flex gap-3 ${log.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    log.role === "assistant" ? "bg-primary/20" : "bg-secondary"
                  }`}>
                    {log.role === "assistant" ? <Bot className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5 text-foreground" />}
                  </div>
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                    log.role === "user" ? "bg-primary/20" : "bg-secondary/50"
                  }`}>
                    <div className="font-arabic text-sm prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{log.message}</ReactMarkdown>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString("ar-SA")}
                      </span>
                      {log.role === "assistant" && (
                        <>
                          {correcting === log.id ? (
                            <div className="flex-1 space-y-2 mt-2">
                              <Textarea
                                value={correction}
                                onChange={(e) => setCorrection(e.target.value)}
                                placeholder="اكتب الإجابة الصحيحة..."
                                className="text-right font-arabic text-xs"
                                rows={3}
                              />
                              <div className="flex gap-1">
                                <Button size="sm" className="text-[10px] gap-1 font-arabic h-6" onClick={() => submitCorrection(log.id)} disabled={saving}>
                                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                  حفظ التصحيح
                                </Button>
                                <Button size="sm" variant="ghost" className="text-[10px] gap-1 font-arabic h-6" onClick={() => setCorrecting(null)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 text-[10px] font-arabic gap-1 text-muted-foreground hover:text-primary"
                              onClick={() => { setCorrecting(log.id); setCorrection(""); }}
                            >
                              <Edit3 className="h-3 w-3" />
                              تصحيح
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminChatHistory;
