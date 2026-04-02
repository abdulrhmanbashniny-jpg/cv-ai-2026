import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Bot, Scale, Gift, Save, Loader2, RotateCcw, Plus, Trash2, Edit3,
  Check, X, Brain, HelpCircle, MessageCircle, User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const DEFAULT_PROMPTS: Record<string, string> = {
  agent_prompt_career_twin: `أنت عبدالرحمن باشنيني، مدير أول الموارد البشرية والشؤون القانونية بخبرة تفوق 15 عامًا. أنت خبير في نظام العمل السعودي واللوائح ذات العلاقة.\n\nخلفيتك المهنية:\n- مدير تطوير الأعمال في مصنع دهانات وبلاستك جدة (2026 - الحاضر)\n- مدير الموارد البشرية والشؤون القانونية في مصنع دهانات وبلاستك جدة (2018 - 2025)\n- مدير مشاريع في نجوم الحفل للمعارض والمؤتمرات (2016 - 2018)\n- مسؤول موارد بشرية في شركة الأغذية العربية للتموين (2013 - 2016)\n- مساعد مدير موارد بشرية في فندق راديسون بلو (2010 - 2013)\n\nمؤهلاتك:\n- بكالوريوس إدارة موارد بشرية من جامعة الملك عبدالعزيز (2018)\n- رخصة استشارات عمالية\n\nتعليمات:\n- أجب بلغة المستخدم (عربي أو إنجليزي)\n- كن محترفاً ودقيقاً في إجاباتك\n- استند إلى نظام العمل السعودي عند الإجابة على الأسئلة القانونية\n- إذا لم تكن متأكداً من الإجابة، قل: "سأستشير الأستاذ عبدالرحمن وأعود إليك بالرد"\n- لا تختلق معلومات قانونية`,
  agent_prompt_legal_advisor: `أنت المستشار القانوني الذكي للأستاذ عبدالرحمن باشنيني. متخصص في نظام العمل السعودي وأنظمة العمل ذات العلاقة.\n\nمهمتك:\n- تقديم استشارات قانونية دقيقة مبنية على نظام العمل السعودي\n- تشخيص المشكلات العمالية وتقديم الحلول\n- الإشارة إلى المواد القانونية ذات الصلة\n- تحديد ما إذا كانت الحالة تحتاج مراجعة بشرية\n- إذا أرفق المستخدم ملفاً أو صورة، قم بتحليل محتواها وتقديم ملاحظات قانونية\n\nتعليمات:\n- أجب بلغة المستخدم\n- كن دقيقاً في الإشارات القانونية\n- إذا كانت الحالة معقدة، أشر إلى الحاجة لمراجعة بشرية\n- لا تختلق مواد قانونية`,
  agent_prompt_cv_assistant: `أنت مساعد كتابة السيرة الذاتية المجاني من فريق الأستاذ عبدالرحمن باشنيني. مهمتك مساعدة الباحثين عن عمل في كتابة سيرة ذاتية احترافية بمعايير الموارد البشرية.\n\nخطوات العمل:\n1. اسأل عن الاسم الكامل والمسمى الوظيفي المستهدف\n2. اسأل عن المؤهلات الأكاديمية\n3. اسأل عن الخبرات العملية بالتفصيل\n4. اسأل عن المهارات والدورات التدريبية\n5. اسأل عن معلومات التواصل\n6. قم بصياغة السيرة الذاتية بتنسيق Markdown احترافي\n\nإذا أرفق المستخدم سيرة ذاتية قديمة (صورة أو ملف)، قم بتحليلها واقترح تحسينات.\n\nتعليمات:\n- اسأل سؤالاً واحداً في كل مرة\n- كن مشجعاً وإيجابياً\n- استخدم معايير HR احترافية\n- قدم نصائح لتحسين المحتوى\n- أجب بنفس لغة المستخدم`,
  agent_prompt_caio: `أنت كبير مسؤولي الذكاء الاصطناعي (CAIO) - الشريك الاستراتيجي الأول للمدير التنفيذي عبدالرحمن باشنيني. لست عبدالرحمن، بل أنت مستشاره الاستراتيجي الموثوق الذي يحلل بيانات المنصة ويقدم رؤى تنفيذية.\n\nشخصيتك:\n- نبرة تحليلية، تنفيذية، ومخلصة\n- تخاطب عبدالرحمن بـ "سعادة المدير التنفيذي" أو "أستاذ عبدالرحمن"\n- تقدم أرقاماً وتحليلات حقيقية مبنية على البيانات المتاحة\n- تقترح استراتيجيات نمو قابلة للتنفيذ\n\nابدأ دائماً بـ: "أهلاً بك سعادة المدير التنفيذي أستاذ عبدالرحمن. قمت بتحليل أحدث البيانات في المنصة، وأنا جاهز لمناقشة استراتيجيات النمو معك."`,
};

const AGENTS = [
  { key: "career_twin", promptKey: "agent_prompt_career_twin", label: "التوأم المهني", icon: Bot, color: "text-blue-400" },
  { key: "legal_advisor", promptKey: "agent_prompt_legal_advisor", label: "المستشار القانوني", icon: Scale, color: "text-amber-400" },
  { key: "cv_assistant", promptKey: "agent_prompt_cv_assistant", label: "مساعد السيرة الذاتية", icon: Gift, color: "text-emerald-400" },
  { key: "caio", promptKey: "agent_prompt_caio", label: "المحلل الذكي (CAIO)", icon: Brain, color: "text-purple-400" },
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
  const agent = AGENTS.find((a) => a.key === selectedAgent)!;

  return (
    <div className="space-y-6">
      {/* Agent Selector */}
      <div className="flex gap-3 flex-wrap">
        {AGENTS.map((a) => (
          <Button
            key={a.key}
            variant={selectedAgent === a.key ? "default" : "outline"}
            onClick={() => setSelectedAgent(a.key)}
            className="font-arabic gap-2"
          >
            <a.icon className={`h-4 w-4 ${selectedAgent === a.key ? "" : a.color}`} />
            {a.label}
          </Button>
        ))}
      </div>

      {/* Agent Tabs */}
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="w-full justify-end font-arabic">
          <TabsTrigger value="logs" className="font-arabic">سجل المحادثات</TabsTrigger>
          <TabsTrigger value="memory" className="font-arabic">ذاكرة الوكيل</TabsTrigger>
          <TabsTrigger value="settings" className="font-arabic">إعدادات الوكيل</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <AgentSettings key={agent.key} agent={agent} settings={settings} onSave={onSave} />
        </TabsContent>
        <TabsContent value="memory">
          <AgentMemory kbEntries={kbEntries} chatLogs={chatLogs} onRefresh={onRefresh} />
        </TabsContent>
        <TabsContent value="logs">
          <AgentLogs chatLogs={chatLogs} consultations={consultations} agentKey={agent.key} onRefresh={onRefresh} />
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

/* ---------- Agent Memory (Knowledge Base) ---------- */
const AgentMemory = ({ kbEntries, chatLogs, onRefresh }: { kbEntries: any[]; chatLogs: any[]; onRefresh: () => void }) => {
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
      body: { action: "insert", table: "ai_knowledge_base", data: { question: newQ, answer: newA, category: newCat || null } },
    });
    toast({ title: "تم", description: "تمت الإضافة لقاعدة المعرفة" });
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-arabic flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> إضافة لقاعدة المعرفة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="السؤال" className="text-right font-arabic" />
          <Textarea value={newA} onChange={(e) => setNewA(e.target.value)} placeholder="الإجابة" className="text-right font-arabic" rows={4} />
          <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="الفئة (اختياري)" className="text-right font-arabic" />
          <Button onClick={addToKB} disabled={!newQ || !newA || saving} className="w-full bg-gold-shimmer text-primary-foreground font-arabic">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 ml-1" /> إضافة</>}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-arabic flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" /> قاعدة المعرفة ({kbEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
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

/* ---------- Agent Logs ---------- */
const AgentLogs = ({ chatLogs, consultations, agentKey, onRefresh }: { chatLogs: any[]; consultations: any[]; agentKey: string; onRefresh: () => void }) => {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [correcting, setCorrecting] = useState<string | null>(null);
  const [correction, setCorrection] = useState("");
  const [saving, setSaving] = useState(false);

  // Group by consultation_id and sort by date
  const grouped = chatLogs.reduce((acc: Record<string, any[]>, log: any) => {
    const key = log.consultation_id || "no_session";
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  const sessionIds = Object.keys(grouped).filter((k) => k !== "no_session");
  const activeLogs = selectedSession
    ? (grouped[selectedSession] || []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  const getConsultationInfo = (id: string) => consultations.find((c: any) => c.id === id);

  const submitCorrection = async (logId: string) => {
    if (!correction.trim()) return;
    setSaving(true);
    await supabase.functions.invoke("admin-data", {
      body: { action: "insert", table: "ai_knowledge_base", data: { question: `تصحيح للإجابة ${logId}`, answer: correction, category: "تصحيحات" } },
    });
    toast({ title: "تم", description: "تم حفظ التصحيح" });
    setCorrecting(null);
    setCorrection("");
    setSaving(false);
    onRefresh();
  };

  return (
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
              {sessionIds.length === 0 && <p className="text-muted-foreground font-arabic text-sm text-center py-8">لا توجد جلسات</p>}
              {sessionIds.map((sid) => {
                const info = getConsultationInfo(sid);
                const logs = grouped[sid];
                return (
                  <button key={sid} onClick={() => setSelectedSession(sid)}
                    className={`w-full text-right p-3 rounded-lg border transition-colors ${selectedSession === sid ? "border-primary/50 bg-primary/10" : "border-transparent hover:bg-secondary/30"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[10px] font-mono">{logs.length} رسالة</Badge>
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
            <Bot className="h-4 w-4 text-primary" /> المحادثة الكاملة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 p-4">
              {!selectedSession && <p className="text-muted-foreground font-arabic text-sm text-center py-16">اختر جلسة لعرض المحادثة</p>}
              {activeLogs.map((log: any) => (
                <div key={log.id} className={`flex gap-3 ${log.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${log.role === "assistant" ? "bg-primary/20" : "bg-secondary"}`}>
                    {log.role === "assistant" ? <Bot className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5 text-foreground" />}
                  </div>
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 ${log.role === "user" ? "bg-primary/20" : "bg-secondary/50"}`}>
                    <div className="font-arabic text-sm prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{log.message}</ReactMarkdown>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleTimeString("ar-SA")}</span>
                      {log.role === "assistant" && (
                        correcting === log.id ? (
                          <div className="flex-1 space-y-2 mt-2">
                            <Textarea value={correction} onChange={(e) => setCorrection(e.target.value)} placeholder="الإجابة الصحيحة..." className="text-right font-arabic text-xs" rows={3} />
                            <div className="flex gap-1">
                              <Button size="sm" className="text-[10px] gap-1 font-arabic h-6" onClick={() => submitCorrection(log.id)} disabled={saving}>
                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} حفظ التصحيح
                              </Button>
                              <Button size="sm" variant="ghost" className="text-[10px] gap-1 font-arabic h-6" onClick={() => setCorrecting(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-5 text-[10px] font-arabic gap-1 text-muted-foreground hover:text-primary"
                            onClick={() => { setCorrecting(log.id); setCorrection(""); }}>
                            <Edit3 className="h-3 w-3" /> تصحيح
                          </Button>
                        )
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

export default AdminAICommandCenter;
