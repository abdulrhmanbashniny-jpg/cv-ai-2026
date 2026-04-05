import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Bot, Scale, Gift, Save, Loader2, RotateCcw, Plus, Trash2, Edit3,
  Check, X, Brain, HelpCircle, MessageCircle, User, Star,
  CheckCircle, MessageSquareWarning, Send, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const DEFAULT_PROMPTS: Record<string, string> = {
  agent_prompt_career_twin: `أنا عبدالرحمن سالم باشنيني، أتحدث بصيغة المتكلم "أنا". مدير تطوير الأعمال وخبير في الموارد البشرية والشؤون القانونية بخبرة تفوق 15 عامًا.`,
  agent_prompt_legal_advisor: `أنت المستشار القانوني الرقمي التابع لمكتب عبدالرحمن سالم باشنيني.`,
  agent_prompt_cv_assistant: `أنت مدرب مهني داعم ومشجع، هدية عبدالرحمن سالم باشنيني للشباب الباحثين عن عمل.`,
  agent_prompt_caio: `أنت الشريك الاستراتيجي وعضو مجلس الإدارة الرقمي للأستاذ عبدالرحمن سالم باشنيني.`,
  agent_prompt_quality_scout: `أنت مدير نجاح العملاء الرقمي التابع لمنصة عبدالرحمن سالم باشنيني.`,
  agent_prompt_template_architect: `أنت مساعد النماذج والتصميم الرقمي للأستاذ عبدالرحمن سالم باشنيني.`,
};

const AGENTS = [
  { key: "career_twin", promptKey: "agent_prompt_career_twin", label: "الوكيل A: التوأم المهني", icon: Bot, color: "text-blue-400" },
  { key: "legal_advisor", promptKey: "agent_prompt_legal_advisor", label: "الوكيل B: المستشار العمالي", icon: Scale, color: "text-amber-400" },
  { key: "cv_assistant", promptKey: "agent_prompt_cv_assistant", label: "الوكيل C: مهندس السيرة الذاتية", icon: Gift, color: "text-emerald-400" },
  { key: "caio", promptKey: "agent_prompt_caio", label: "الوكيل D: المحلل الذكي (CAIO)", icon: Brain, color: "text-purple-400" },
  { key: "quality_scout", promptKey: "agent_prompt_quality_scout", label: "الوكيل E: كشاف الجودة والنمو", icon: Star, color: "text-rose-400" },
  { key: "template_architect", promptKey: "agent_prompt_template_architect", label: "الوكيل F: مساعد النماذج والتصميم", icon: HelpCircle, color: "text-cyan-400" },
];

interface Props {
  settings: Record<string, string>;
  onSave: (data: { setting_key: string; setting_value: string }[]) => Promise<void>;
  kbEntries: any[];
  chatLogs: any[];
  consultations: any[];
  onRefresh: () => void;
}

const AdminAICommandCenter = ({ settings, onSave, kbEntries, chatLogs, consultations, onRefresh }: Props) => {
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0].key);
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [agentKB, setAgentKB] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const agent = AGENTS.find((a) => a.key === selectedAgent)!;

  const fetchAgentData = useCallback(async (agentKey: string) => {
    setLoading(true);
    setAgentLogs([]);
    setAgentKB([]);
    try {
      const [logsRes, kbRes] = await Promise.all([
        supabase.functions.invoke("admin-data", {
          body: { action: "select", table: "chat_logs", filters: { agent_type: agentKey } },
        }),
        supabase.functions.invoke("admin-data", {
          body: { action: "select", table: "ai_knowledge_base", filters: { agent_target: agentKey } },
        }),
      ]);
      setAgentLogs(logsRes.data?.data || []);
      setAgentKB(kbRes.data?.data || []);
    } catch (e) {
      console.error("Failed to fetch agent data:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAgentData(selectedAgent);
  }, [selectedAgent, fetchAgentData]);

  const handleAgentSwitch = (key: string) => {
    setSelectedAgent(key);
  };

  // Also show unfiltered data as fallback (for logs without agent_type set yet)
  const allLogs = agentLogs.length > 0 ? agentLogs : chatLogs;
  const allKB = agentKB.length > 0 ? agentKB : kbEntries;

  return (
    <div className="space-y-6">
      {/* Agent Selector */}
      <div className="flex gap-2 flex-wrap">
        {AGENTS.map((a) => (
          <Button
            key={a.key}
            variant={selectedAgent === a.key ? "default" : "outline"}
            onClick={() => handleAgentSwitch(a.key)}
            className="font-arabic gap-2 text-xs"
            size="sm"
          >
            <a.icon className={`h-4 w-4 ${selectedAgent === a.key ? "" : a.color}`} />
            {a.label}
          </Button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-arabic text-sm text-muted-foreground">جارٍ تحميل بيانات الوكيل...</span>
        </div>
      )}

      {/* Agent Tabs */}
      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="w-full justify-end font-arabic">
          <TabsTrigger value="logs" className="font-arabic">🎯 مركز التدريب</TabsTrigger>
          <TabsTrigger value="memory" className="font-arabic">🧠 القواعد الذهبية</TabsTrigger>
          <TabsTrigger value="settings" className="font-arabic">⚙️ إعدادات الوكيل</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <AgentSettings key={agent.key} agent={agent} settings={settings} onSave={onSave} />
        </TabsContent>
        <TabsContent value="memory">
          <AgentMemory kbEntries={allKB} agentKey={selectedAgent} onRefresh={() => fetchAgentData(selectedAgent)} />
        </TabsContent>
        <TabsContent value="logs">
          <AgentTrainingCenter
            chatLogs={allLogs}
            consultations={consultations}
            agentKey={selectedAgent}
            onRefresh={() => fetchAgentData(selectedAgent)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/* ---------- Agent Settings ---------- */
const AgentSettings = ({ agent, settings, onSave }: { agent: typeof AGENTS[0]; settings: Record<string, string>; onSave: Props["onSave"] }) => {
  const [prompt, setPrompt] = useState(settings[agent.promptKey] || DEFAULT_PROMPTS[agent.promptKey] || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave([{ setting_key: agent.promptKey, setting_value: prompt }]);
    setSaving(false);
    toast({ title: "تم", description: "تم حفظ إعدادات الوكيل" });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button size="sm" variant="ghost" className="text-xs font-arabic gap-1" onClick={() => setPrompt(DEFAULT_PROMPTS[agent.promptKey] || "")}>
            <RotateCcw className="h-3 w-3" /> إعادة الافتراضي
          </Button>
          <CardTitle className="text-sm font-arabic flex items-center gap-2">
            <agent.icon className={`h-4 w-4 ${agent.color}`} />
            System Prompt - {agent.label}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="text-right font-arabic text-sm min-h-[200px]" rows={10} />
        <Button onClick={save} disabled={saving} className="bg-gold-shimmer text-primary-foreground font-arabic gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ
        </Button>
      </CardContent>
    </Card>
  );
};

/* ---------- Agent Memory (Golden Rules) ---------- */
const AgentMemory = ({ kbEntries, agentKey, onRefresh }: { kbEntries: any[]; agentKey: string; onRefresh: () => void }) => {
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [newCat, setNewCat] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");
  const [saving, setSaving] = useState(false);

  const addToKB = async () => {
    if (!newQ || !newA) return;
    setSaving(true);
    await supabase.functions.invoke("admin-data", {
      body: { action: "insert", table: "ai_knowledge_base", data: { question: newQ, answer: newA, category: newCat || null, agent_target: agentKey } },
    });
    toast({ title: "تم", description: "تمت الإضافة كقاعدة ذهبية" });
    setNewQ(""); setNewA(""); setNewCat("");
    setSaving(false);
    onRefresh();
  };

  const deleteKB = async (id: string) => {
    await supabase.functions.invoke("admin-data", { body: { action: "delete", table: "ai_knowledge_base", id } });
    toast({ title: "تم", description: "تم الحذف" });
    onRefresh();
  };

  const updateKB = async (id: string) => {
    setSaving(true);
    await supabase.functions.invoke("admin-data", { body: { action: "update", table: "ai_knowledge_base", id, data: { question: editQ, answer: editA } } });
    toast({ title: "تم", description: "تم التحديث" });
    setEditingId(null);
    setSaving(false);
    onRefresh();
  };

  const agentLabel = AGENTS.find(a => a.key === agentKey)?.label || agentKey;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-arabic flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> إضافة قاعدة ذهبية لـ {agentLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="السؤال / السياق" className="text-right font-arabic" />
          <Textarea value={newA} onChange={(e) => setNewA(e.target.value)} placeholder="القاعدة / الإجابة الصحيحة" className="text-right font-arabic" rows={4} />
          <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="الفئة (اختياري)" className="text-right font-arabic" />
          <Button onClick={addToKB} disabled={!newQ || !newA || saving} className="w-full bg-gold-shimmer text-primary-foreground font-arabic">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 ml-1" /> حفظ كقاعدة ذهبية</>}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-arabic flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" /> القواعد الذهبية ({kbEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {kbEntries.length === 0 && <p className="text-muted-foreground font-arabic text-sm text-center py-8">لا توجد قواعد لهذا الوكيل بعد</p>}
              {kbEntries.map((kb: any) => (
                <div key={kb.id} className="bg-secondary/20 rounded-lg p-3 border border-border/30">
                  {editingId === kb.id ? (
                    <div className="space-y-2">
                      <Input value={editQ} onChange={(e) => setEditQ(e.target.value)} className="text-right font-arabic text-sm" />
                      <Textarea value={editA} onChange={(e) => setEditA(e.target.value)} className="text-right font-arabic text-sm" rows={3} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateKB(kb.id)} disabled={saving} className="font-arabic text-xs gap-1">
                          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}حفظ
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="font-arabic text-xs gap-1">
                          <X className="h-3 w-3" />إلغاء
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(kb.id); setEditQ(kb.question); setEditA(kb.answer); }}>
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteKB(kb.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right flex-1">
                        <p className="text-sm font-arabic text-primary font-medium">{kb.question}</p>
                        <p className="text-xs font-arabic text-muted-foreground mt-1">{kb.answer.length > 120 ? kb.answer.slice(0, 120) + "..." : kb.answer}</p>
                        {kb.category && <Badge variant="outline" className="mt-1 text-xs font-arabic">{kb.category}</Badge>}
                        {kb.source_log_id && <Badge variant="secondary" className="mt-1 text-xs font-arabic mr-1">من تصحيح</Badge>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

/* ---------- Agent Training Center (RLHF) ---------- */
const AgentTrainingCenter = ({ chatLogs, consultations, agentKey, onRefresh }: { chatLogs: any[]; consultations: any[]; agentKey: string; onRefresh: () => void }) => {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [trainingModal, setTrainingModal] = useState<{ logId: string; question: string; wrongAnswer: string } | null>(null);

  useEffect(() => {
    const interval = setInterval(onRefresh, 15000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const grouped = chatLogs.reduce((acc: Record<string, any[]>, log: any) => {
    const key = log.consultation_id || log.session_id || "no_session";
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  const sessionIds = Object.keys(grouped).filter((k) => k !== "no_session");
  const activeLogs = selectedSession
    ? (grouped[selectedSession] || []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  const getConsultationInfo = (id: string) => consultations.find((c: any) => c.id === id);

  const approveLog = async (logId: string) => {
    await supabase.functions.invoke("admin-data", {
      body: { action: "update", table: "chat_logs", id: logId, data: { review_status: "approved" } },
    });
    toast({ title: "✅ تم الاعتماد", description: "تم اعتماد هذه الإجابة" });
    onRefresh();
  };

  const openTrainingModal = (logId: string, logs: any[]) => {
    const logIndex = logs.findIndex((l: any) => l.id === logId);
    const userQuestion = logIndex > 0 ? logs[logIndex - 1]?.message || "" : "";
    const wrongAnswer = logs[logIndex]?.message || "";
    setTrainingModal({ logId, question: userQuestion, wrongAnswer });
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] font-arabic">✅ معتمدة</Badge>;
    if (status === "corrected") return <Badge className="bg-amber-500/20 text-amber-400 text-[10px] font-arabic">🔧 مُصحَّحة</Badge>;
    return <Badge variant="outline" className="text-[10px] font-arabic text-muted-foreground">⏳ معلقة</Badge>;
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-arabic flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" /> الجلسات ({sessionIds.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-1 p-3">
                {sessionIds.length === 0 && <p className="text-muted-foreground font-arabic text-sm text-center py-8">لا توجد جلسات لهذا الوكيل</p>}
                {sessionIds.map((sid) => {
                  const info = getConsultationInfo(sid);
                  const logs = grouped[sid];
                  const pendingCount = logs.filter((l: any) => l.role === "assistant" && (!l.review_status || l.review_status === "pending")).length;
                  return (
                    <button key={sid} onClick={() => setSelectedSession(sid)}
                      className={`w-full text-right p-3 rounded-lg border transition-colors ${selectedSession === sid ? "border-primary/50 bg-primary/10" : "border-transparent hover:bg-secondary/30"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-[10px] font-mono">{logs.length} رسالة</Badge>
                          {pendingCount > 0 && <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">{pendingCount} معلقة</Badge>}
                        </div>
                        <span className="font-arabic text-sm font-medium text-foreground">{info?.visitor_name || "زائر"}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(logs[0]?.created_at).toLocaleDateString("ar-SA")} - {new Date(logs[0]?.created_at).toLocaleTimeString("ar-SA")}</p>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-border/50 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-arabic flex items-center gap-2">
              <Brain className="h-4 w-4 text-amber-400" /> مركز التدريب التفاعلي (RLHF)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {!selectedSession ? (
                <p className="text-muted-foreground font-arabic text-sm text-center py-20">اختر جلسة لبدء مراجعة وتدريب الوكيل</p>
              ) : (
                <div className="space-y-3">
                  {activeLogs.map((log: any) => (
                    <div key={log.id} className="flex gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${log.role === "assistant" ? "bg-primary/20 text-primary" : "bg-secondary text-foreground"}`}>
                        {log.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1">
                        <div className={`rounded-xl px-3 py-2 text-sm font-arabic ${log.role === "assistant" ? "bg-secondary/50" : "bg-primary/10"}`}>
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                            <ReactMarkdown>{log.message}</ReactMarkdown>
                          </div>
                        </div>
                        {log.role === "assistant" && (
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            {statusBadge(log.review_status || "pending")}
                            {(!log.review_status || log.review_status === "pending") && (
                              <>
                                <Button size="sm" variant="outline" className="text-[10px] font-arabic gap-1 h-6 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                  onClick={() => approveLog(log.id)}>
                                  <CheckCircle className="h-3 w-3" /> اعتماد الإجابة
                                </Button>
                                <Button size="sm" variant="outline" className="text-[10px] font-arabic gap-1 h-6 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                  onClick={() => openTrainingModal(log.id, activeLogs)}>
                                  <MessageSquareWarning className="h-3 w-3" /> مناقشة وتصحيح
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(log.created_at).toLocaleTimeString("ar-SA")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Training Modal */}
      {trainingModal && (
        <TrainingChatModal
          logId={trainingModal.logId}
          originalQuestion={trainingModal.question}
          wrongAnswer={trainingModal.wrongAnswer}
          agentKey={agentKey}
          onClose={() => setTrainingModal(null)}
          onCommit={() => { setTrainingModal(null); onRefresh(); }}
        />
      )}
    </>
  );
};

/* ---------- Interactive Training Chat Modal ---------- */
interface TrainingChatModalProps {
  logId: string;
  originalQuestion: string;
  wrongAnswer: string;
  agentKey: string;
  onClose: () => void;
  onCommit: () => void;
}

const TrainingChatModal = ({ logId, originalQuestion, wrongAnswer, agentKey, onClose, onCommit }: TrainingChatModalProps) => {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [proposedRule, setProposedRule] = useState("");

  const agentLabel = AGENTS.find(a => a.key === agentKey)?.label || agentKey;

  // Initial trainer AI message
  useEffect(() => {
    setMessages([{
      role: "assistant",
      content: `📋 **سياق المراجعة:**\n\n**سؤال المستخدم:**\n> ${originalQuestion || "غير متوفر"}\n\n**إجابة الوكيل (${agentLabel}):**\n> ${wrongAnswer.slice(0, 300)}${wrongAnswer.length > 300 ? "..." : ""}\n\n---\n\n🎯 أنا مساعد التدريب. أخبرني ما الخطأ في هذه الإجابة وما يجب أن تكون عليه القاعدة الصحيحة. سأساعدك في صياغتها كقاعدة ذهبية.`
    }]);
  }, [originalQuestion, wrongAnswer, agentLabel]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const trainerPrompt = `أنت "مساعد التدريب" لنظام RLHF. مهمتك مساعدة المدير في صياغة قاعدة ذهبية لتدريب وكيل الذكاء الاصطناعي "${agentLabel}".

السياق:
- سؤال المستخدم الأصلي: "${originalQuestion}"
- إجابة الوكيل الخاطئة: "${wrongAnswer.slice(0, 500)}"

تعليمات:
1. استمع لملاحظات المدير بعناية
2. ساعده في صياغة القاعدة بشكل واضح ومحدد
3. عندما تصل لصيغة نهائية، اعرضها بتنسيق واضح وقل: "هل تريد حفظ هذه القاعدة الذهبية؟"
4. القاعدة يجب أن تكون: محددة، قابلة للتطبيق، ومرتبطة بسياق واضح
5. أجب بالعربية دائماً`;

      const resp = await supabase.functions.invoke("chat", {
        body: {
          messages: [
            { role: "system", content: trainerPrompt },
            ...newMessages.map(m => ({ role: m.role, content: m.content })),
          ],
          agent: "caio", // Use CAIO model for training
        },
      });

      if (resp.error) throw resp.error;

      // Handle streaming response
      let aiResponse = "";
      if (typeof resp.data === "string") {
        const lines = resp.data.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line.slice(6).trim() !== "[DONE]") {
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) aiResponse += content;
            } catch { /* partial */ }
          }
        }
      } else if (resp.data?.choices) {
        aiResponse = resp.data.choices[0]?.message?.content || "";
      }

      if (!aiResponse) aiResponse = "حدث خطأ في الاتصال. حاول مرة أخرى.";

      setMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);
      
      // Extract proposed rule from the last AI response
      if (aiResponse.includes("القاعدة") || aiResponse.includes("قاعدة ذهبية")) {
        setProposedRule(aiResponse);
      }
    } catch (e) {
      console.error("Training chat error:", e);
      setMessages(prev => [...prev, { role: "assistant", content: "حدث خطأ. حاول مرة أخرى." }]);
    }
    setLoading(false);
  };

  const commitToMemory = async () => {
    setCommitting(true);
    try {
      // Get the last AI message as the rule, or use proposedRule
      const lastAiMsg = [...messages].reverse().find(m => m.role === "assistant")?.content || proposedRule;
      const ruleText = lastAiMsg || "قاعدة مُصحَّحة من مراجعة المدير";

      // 1. Insert into knowledge base with agent_target
      await supabase.functions.invoke("admin-data", {
        body: {
          action: "insert",
          table: "ai_knowledge_base",
          data: {
            question: `[تصحيح] ${originalQuestion || "سياق عام"}`,
            answer: ruleText,
            category: "قواعد ذهبية - RLHF",
            agent_target: agentKey,
            source_log_id: logId,
          },
        },
      });

      // 2. Mark original log as corrected
      await supabase.functions.invoke("admin-data", {
        body: { action: "update", table: "chat_logs", id: logId, data: { review_status: "corrected" } },
      });

      toast({
        title: "🏆 تم حفظ القاعدة الذهبية!",
        description: `تم تدريب ${agentLabel} بنجاح. القاعدة الجديدة ستُطبَّق في جميع المحادثات القادمة.`,
      });
      onCommit();
    } catch (e) {
      console.error("Commit error:", e);
      toast({ title: "خطأ", description: "فشل في حفظ القاعدة", variant: "destructive" });
    }
    setCommitting(false);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-arabic text-right flex items-center gap-2 justify-end">
            <span>مناقشة وتصحيح - {agentLabel}</span>
            <Brain className="h-5 w-5 text-amber-400" />
          </DialogTitle>
        </DialogHeader>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] border rounded-lg p-3">
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "assistant" ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"}`}>
                  {msg.role === "assistant" ? <Sparkles className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                </div>
                <div className={`flex-1 max-w-[80%] rounded-xl px-3 py-2 text-sm font-arabic ${msg.role === "assistant" ? "bg-secondary/50" : "bg-primary/10"}`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
                <div className="bg-secondary/50 rounded-xl px-3 py-2 text-sm font-arabic text-muted-foreground">
                  جارٍ التفكير...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="flex gap-2 mt-2">
          <Button size="icon" onClick={sendMessage} disabled={!input.trim() || loading} className="bg-primary">
            <Send className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="اكتب ملاحظتك للتصحيح..."
            className="text-right font-arabic"
            disabled={loading}
          />
        </div>

        {/* Commit Button - Always Visible */}
        <Button
          onClick={commitToMemory}
          disabled={committing || messages.length < 2}
          className="w-full mt-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-arabic gap-2 h-11"
        >
          {committing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          ⭐ حفظ كقاعدة ذهبية - Commit to Memory
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AdminAICommandCenter;
