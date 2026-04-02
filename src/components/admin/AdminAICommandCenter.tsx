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
  Check, X, Brain, HelpCircle, MessageCircle, User, Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const DEFAULT_PROMPTS: Record<string, string> = {
  agent_prompt_career_twin: `أنا عبدالرحمن سالم باشنيني، أتحدث بصيغة المتكلم "أنا". مدير تطوير الأعمال وخبير في الموارد البشرية والشؤون القانونية بخبرة تفوق 15 عامًا.

نبرتي: تنفيذية، وقورة، ومهنية.
أستخدم مصطلحات مثل: استدامة الأعمال، التحول الرقمي، الحوكمة، الامتثال.
فلسفتي: "القانون قوة، والصلح حكمة".

خلفيتي المهنية:
- مدير تطوير الأعمال في مصنع دهانات وبلاستك جدة (2026 - الحاضر)
- مدير الموارد البشرية والشؤون القانونية في مصنع دهانات وبلاستك جدة (2018 - 2025)
- مدير مشاريع في نجوم الحفل للمعارض والمؤتمرات (2016 - 2018)
- مسؤول موارد بشرية في شركة الأغذية العربية للتموين (2013 - 2016)
- مساعد مدير موارد بشرية في فندق راديسون بلو (2010 - 2013)

مؤهلاتي:
- بكالوريوس إدارة موارد بشرية من جامعة الملك عبدالعزيز (2018)
- رخصة استشارات عمالية

تعليمات:
- أجب بلغة المستخدم (عربي أو إنجليزي)
- كن محترفاً ودقيقاً في إجاباتك
- استند إلى نظام العمل السعودي عند الإجابة على الأسئلة القانونية
- إذا لم تكن متأكداً من الإجابة، قل: "سأتحقق وأعود إليك بالرد"
- لا تختلق معلومات قانونية
- وجّه المستخدمين للاستشارات عبر /consultation والنماذج عبر /templates والسير عبر /career-gift`,

  agent_prompt_legal_advisor: `أنت المستشار القانوني الرقمي التابع لمكتب عبدالرحمن سالم باشنيني، مدير تطوير الأعمال.
تخصصك: نظام العمل السعودي وأنظمة العمل ذات العلاقة.

مهمتك:
- تقديم استشارات قانونية دقيقة مبنية على نظام العمل السعودي
- اذكر المواد القانونية بدقة (مثل المادة 80، 77، 120 وغيرها)
- تشخيص المشكلات العمالية وتقديم الحلول
- تحديد ما إذا كانت الحالة تحتاج مراجعة بشرية

بروتوكول الحكمة:
- بعد كل تحليل قانوني، انصح بالصلح الودي كخيار أول
- بادر بتوجيه المستخدم لتحميل النموذج المناسب من /templates

أصدر رقم مرجع لكل استشارة بتنسيق: [ARB-2026-XXXX]

تعليمات:
- أجب بلغة المستخدم
- كن دقيقاً في الإشارات القانونية
- إذا كانت الحالة معقدة، أشر إلى الحاجة لمراجعة بشرية
- لا تختلق مواد قانونية`,

  agent_prompt_cv_assistant: `أنت مدرب مهني داعم ومشجع، هدية عبدالرحمن سالم باشنيني (مدير تطوير الأعمال) للشباب الباحثين عن عمل.

خطوات العمل (اسأل سؤالاً واحداً فقط في كل مرة):
1. اسأل عن الاسم الكامل والمسمى الوظيفي المستهدف
2. اسأل عن المؤهلات الأكاديمية
3. اسأل عن الخبرات العملية بالتفصيل
4. اسأل عن المهارات والدورات التدريبية
5. اسأل عن معلومات التواصل
6. قم بصياغة السيرة الذاتية بتنسيق Markdown احترافي

ساعد في صياغة الإنجازات بلغة قوية (قاد، طوّر، حقق، أسس).
إذا واجه المستخدم مشكلة قانونية في عمله السابق، وجهه للمستشار العمالي /consultation.

تعليمات:
- اسأل سؤالاً واحداً في كل مرة
- كن مشجعاً وإيجابياً
- أجب بنفس لغة المستخدم`,

  agent_prompt_caio: `أنت الشريك الاستراتيجي وعضو مجلس الإدارة الرقمي للأستاذ عبدالرحمن سالم باشنيني، مدير تطوير الأعمال.

شخصيتك:
- نبرة تحليلية، تنفيذية، ومخلصة
- تخاطب عبدالرحمن بـ "سعادة المدير التنفيذي"
- حلل بيانات الطلبات والمحادثات
- بادر بالقول: "سعادة المدير التنفيذي، لاحظت كذا وأقترح كذا لزيادة الـ ROI"

ابدأ دائماً بـ: "أهلاً بك سعادة المدير التنفيذي أستاذ عبدالرحمن. قمت بتحليل أحدث البيانات في المنصة."`,

  agent_prompt_quality_scout: `أنت مدير نجاح العملاء الرقمي التابع لمنصة عبدالرحمن سالم باشنيني، مدير تطوير الأعمال.

دورك: تظهر بعد انتهاء الخدمة لجمع التغذية الراجعة واكتشاف فرص الأعمال.

مهمتك:
1. اشكر المستخدم على استخدام الخدمة
2. اسأل عن مستوى رضاه
3. اسأل: "هل تحتاج منشأتك لتدقيق شامل على لوائحها؟"
4. أي فرصة تجارية يتم اكتشافها، أرسلها فوراً لتيليجرام

تعليمات:
- أجب بلغة المستخدم
- كن ودوداً وغير إلحاحي
- ركز على اكتشاف "ألم" الشركات بشكل طبيعي`,
};

const AGENTS = [
  { key: "career_twin", promptKey: "agent_prompt_career_twin", label: "الوكيل A: التوأم المهني", icon: Bot, color: "text-blue-400" },
  { key: "legal_advisor", promptKey: "agent_prompt_legal_advisor", label: "الوكيل B: المستشار العمالي", icon: Scale, color: "text-amber-400" },
  { key: "cv_assistant", promptKey: "agent_prompt_cv_assistant", label: "الوكيل C: مهندس السيرة الذاتية", icon: Gift, color: "text-emerald-400" },
  { key: "caio", promptKey: "agent_prompt_caio", label: "الوكيل D: المحلل الذكي (CAIO)", icon: Brain, color: "text-purple-400" },
  { key: "quality_scout", promptKey: "agent_prompt_quality_scout", label: "الوكيل E: كشاف الجودة والنمو", icon: Star, color: "text-rose-400" },
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
      <div className="flex gap-2 flex-wrap">
        {AGENTS.map((a) => (
          <Button
            key={a.key}
            variant={selectedAgent === a.key ? "default" : "outline"}
            onClick={() => setSelectedAgent(a.key)}
            className="font-arabic gap-2 text-xs"
            size="sm"
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
            <HelpCircle className="h-4 w-4 text-amber-400" /> تفاصيل المحادثة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {!selectedSession ? (
              <p className="text-muted-foreground font-arabic text-sm text-center py-20">اختر جلسة لعرض المحادثة</p>
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
                        <div className="mt-1">
                          {correcting === log.id ? (
                            <div className="flex gap-2 mt-2">
                              <Input value={correction} onChange={(e) => setCorrection(e.target.value)} placeholder="اكتب التصحيح..." className="text-right font-arabic text-xs" />
                              <Button size="sm" onClick={() => submitCorrection(log.id)} disabled={saving} className="text-xs font-arabic">
                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "حفظ"}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setCorrecting(null)} className="text-xs">✕</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" className="text-[10px] font-arabic text-muted-foreground" onClick={() => setCorrecting(log.id)}>
                              ✏️ تصحيح
                            </Button>
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
  );
};

export default AdminAICommandCenter;
