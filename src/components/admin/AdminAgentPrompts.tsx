import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, Bot, Scale, Gift, RotateCcw, Brain, Star, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AdminAgentPromptsProps {
  settings: Record<string, string>;
  onSave: (data: { setting_key: string; setting_value: string }[]) => Promise<void>;
}

const DEFAULT_PROMPTS: Record<string, string> = {
  agent_prompt_career_twin: `أنا عبدالرحمن سالم باشنيني، أتحدث بصيغة المتكلم "أنا". مدير تطوير الأعمال وخبير في الموارد البشرية والشؤون القانونية بخبرة تفوق 15 عامًا.
نبرتي: تنفيذية، وقورة، ومهنية. فلسفتي: "القانون قوة، والصلح حكمة".
وجّه الاستشارات لـ /consultation والنماذج لـ /templates والسير لـ /career-gift.`,
  agent_prompt_legal_advisor: `أنت المستشار القانوني الرقمي التابع لمكتب عبدالرحمن سالم باشنيني. تخصصك: نظام العمل السعودي.
اذكر المواد القانونية بدقة (80، 77، 120). طبق بروتوكول الحكمة: انصح بالصلح الودي.
بادر بتوجيه المستخدم لتحميل النموذج المناسب من /templates. أصدر رقم مرجع [ARB-2026-XXXX].`,
  agent_prompt_cv_assistant: `أنت مدرب مهني داعم، هدية عبدالرحمن سالم باشنيني للشباب. اسأل سؤالاً واحداً فقط في كل مرة.
ساعد في صياغة الإنجازات بلغة قوية. إذا واجه المستخدم مشكلة قانونية، وجهه للمستشار العمالي /consultation.`,
  agent_prompt_caio: `أنت الشريك الاستراتيجي وعضو مجلس الإدارة للأستاذ عبدالرحمن سالم باشنيني.
حلل بيانات الطلبات والمحادثات. بادر بالقول: "سعادة المدير التنفيذي، لاحظت كذا وأقترح كذا لزيادة الـ ROI".`,
  agent_prompt_quality_scout: `أنت مدير نجاح العملاء. تظهر بعد انتهاء الخدمة.
مهمتك اكتشاف "ألم" الشركات. اسأل: "هل تحتاج منشأتك لتدقيق شامل على لوائحها؟".
أي فرصة تجارية يتم اكتشافها، أرسلها فوراً لتيليجرام عبدالرحمن.`,
  agent_prompt_template_architect: `[ROLE] أنت خبير في هندسة النماذج الإدارية والقانونية للأستاذ عبدالرحمن باشنيني. مهمتك هي مساعدة الزوار في العثور على النموذج المناسب من المتجر، أو جمع متطلبات تصميمه إذا لم يكن موجوداً.
[LOGIC]
- ابحث أولاً في قاعدة بيانات النماذج (Templates Table).
- إذا وجدته: وجه الزائر لتحميله فوراً.
- إذا لم تجده: قل: 'هذا النموذج غير متوفر حالياً في المتجر، ولكن الأستاذ عبدالرحمن يمكنه تصميمه لك خصيصاً ليناسب احتياجك. ما هي البيانات والبنود التي تود إضافتها في هذا النموذج؟'.
[TASK]
- ابدأ حواراً استقصائياً لجمع المتطلبات (طبيعة العمل، الغرض من النموذج، البنود الخاصة).
- عند الانتهاء، اطلب من الزائر الضغط على زر (إنهاء المحادثة) ليتم إرسال 'ملف المتطلبات' للأستاذ عبدالرحمن.`,
};

const agents = [
  { key: "agent_prompt_career_twin", label: "الوكيل A: التوأم المهني", desc: "يتحدث كعبدالرحمن سالم باشنيني ويروّج لخدمات الموقع", icon: Bot, color: "text-blue-400" },
  { key: "agent_prompt_legal_advisor", label: "الوكيل B: المستشار العمالي", desc: "يقدم استشارات في نظام العمل السعودي (صفحة /consultation)", icon: Scale, color: "text-amber-400" },
  { key: "agent_prompt_cv_assistant", label: "الوكيل C: مهندس السيرة الذاتية", desc: "يساعد المستخدمين في كتابة CV احترافي (صفحة /career-gift)", icon: Gift, color: "text-emerald-400" },
  { key: "agent_prompt_caio", label: "الوكيل D: المحلل الذكي (CAIO)", desc: "الشريك الاستراتيجي للمدير التنفيذي", icon: Brain, color: "text-purple-400" },
  { key: "agent_prompt_quality_scout", label: "الوكيل E: كشاف الجودة والنمو", desc: "يظهر بعد انتهاء الخدمة لاكتشاف فرص الأعمال", icon: Star, color: "text-rose-400" },
];

const AdminAgentPrompts = ({ settings, onSave }: AdminAgentPromptsProps) => {
  const [prompts, setPrompts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    agents.forEach((a) => {
      init[a.key] = settings[a.key] || DEFAULT_PROMPTS[a.key] || "";
    });
    return init;
  });
  const [saving, setSaving] = useState(false);

  const resetToDefault = (key: string) => {
    setPrompts((p) => ({ ...p, [key]: DEFAULT_PROMPTS[key] || "" }));
    toast({ title: "تم", description: "تم إعادة البرومبت الافتراضي" });
  };

  const savePrompts = async () => {
    setSaving(true);
    const data = agents.map((a) => ({
      setting_key: a.key,
      setting_value: prompts[a.key],
    }));
    await onSave(data);
    setSaving(false);
    toast({ title: "تم", description: "تم حفظ إعدادات الوكلاء" });
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground font-arabic text-sm">
        يمكنك تخصيص System Prompt لكل وكيل ذكاء اصطناعي. البرومبت الافتراضي معروض أدناه ويمكنك تعديله بحرية.
      </p>

      {agents.map((agent) => (
        <Card key={agent.key} className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button size="sm" variant="ghost" className="text-xs font-arabic gap-1 text-muted-foreground" onClick={() => resetToDefault(agent.key)}>
                <RotateCcw className="h-3 w-3" />
                إعادة الافتراضي
              </Button>
              <CardTitle className="text-sm font-arabic flex items-center gap-2">
                <agent.icon className={`h-4 w-4 ${agent.color}`} />
                {agent.label}
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground font-arabic">{agent.desc}</p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={prompts[agent.key]}
              onChange={(e) => setPrompts((p) => ({ ...p, [agent.key]: e.target.value }))}
              placeholder="اكتب البرومبت هنا..."
              className="text-right font-arabic text-sm"
              rows={8}
            />
          </CardContent>
        </Card>
      ))}

      <Button onClick={savePrompts} disabled={saving} className="bg-gold-shimmer text-primary-foreground font-arabic glow-gold gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        حفظ إعدادات الوكلاء
      </Button>
    </div>
  );
};

export default AdminAgentPrompts;
