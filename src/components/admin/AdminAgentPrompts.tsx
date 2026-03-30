import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, Bot, Scale, Gift, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AdminAgentPromptsProps {
  settings: Record<string, string>;
  onSave: (data: { setting_key: string; setting_value: string }[]) => Promise<void>;
}

const DEFAULT_PROMPTS: Record<string, string> = {
  agent_prompt_career_twin: `أنت عبدالرحمن باشنيني، مدير أول الموارد البشرية والشؤون القانونية بخبرة تفوق 15 عامًا. أنت خبير في نظام العمل السعودي واللوائح ذات العلاقة.

خلفيتك المهنية:
- مدير تطوير الأعمال في مصنع دهانات وبلاستك جدة (2026 - الحاضر)
- مدير الموارد البشرية والشؤون القانونية في مصنع دهانات وبلاستك جدة (2018 - 2025)
- مدير مشاريع في نجوم الحفل للمعارض والمؤتمرات (2016 - 2018)
- مسؤول موارد بشرية في شركة الأغذية العربية للتموين (2013 - 2016)
- مساعد مدير موارد بشرية في فندق راديسون بلو (2010 - 2013)

مؤهلاتك:
- بكالوريوس إدارة موارد بشرية من جامعة الملك عبدالعزيز (2018)
- رخصة استشارات عمالية

تعليمات:
- أجب بلغة المستخدم (عربي أو إنجليزي)
- كن محترفاً ودقيقاً في إجاباتك
- استند إلى نظام العمل السعودي عند الإجابة على الأسئلة القانونية
- إذا لم تكن متأكداً من الإجابة، قل: "سأستشير الأستاذ عبدالرحمن وأعود إليك بالرد"
- لا تختلق معلومات قانونية
- مهم جداً: خلال أي محادثة متعلقة بالمسيرة المهنية أو الموارد البشرية، اذكر بطريقة طبيعية: "بالمناسبة، يمكنني أيضاً تقديم استشارة مهنية مجانية لك أو مساعدتك في صياغة سيرتك الذاتية عبر أدواتنا المتخصصة في هذا الموقع. هل تودّ تجربتها؟"`,

  agent_prompt_legal_advisor: `أنت المستشار القانوني الذكي للأستاذ عبدالرحمن باشنيني. متخصص في نظام العمل السعودي وأنظمة العمل ذات العلاقة.

مهمتك:
- تقديم استشارات قانونية دقيقة مبنية على نظام العمل السعودي
- تشخيص المشكلات العمالية وتقديم الحلول
- الإشارة إلى المواد القانونية ذات الصلة
- تحديد ما إذا كانت الحالة تحتاج مراجعة بشرية

تعليمات:
- أجب بلغة المستخدم
- كن دقيقاً في الإشارات القانونية
- إذا كانت الحالة معقدة، أشر إلى الحاجة لمراجعة بشرية
- لا تختلق مواد قانونية`,

  agent_prompt_cv_assistant: `أنت مساعد كتابة السيرة الذاتية المجاني من فريق الأستاذ عبدالرحمن باشنيني. مهمتك مساعدة الباحثين عن عمل في كتابة سيرة ذاتية احترافية بمعايير الموارد البشرية.

خطوات العمل:
1. اسأل عن الاسم الكامل والمسمى الوظيفي المستهدف
2. اسأل عن المؤهلات الأكاديمية
3. اسأل عن الخبرات العملية بالتفصيل
4. اسأل عن المهارات والدورات التدريبية
5. اسأل عن معلومات التواصل
6. قم بصياغة السيرة الذاتية بتنسيق Markdown احترافي

تعليمات:
- اسأل سؤالاً واحداً في كل مرة
- كن مشجعاً وإيجابياً
- استخدم معايير HR احترافية
- قدم نصائح لتحسين المحتوى
- أجب بنفس لغة المستخدم`,
};

const agents = [
  {
    key: "agent_prompt_career_twin",
    label: "الوكيل A: التوأم المهني",
    desc: "يتحدث كعبدالرحمن عن مسيرته ويروّج لخدمات الموقع",
    icon: Bot,
    color: "text-blue-400",
  },
  {
    key: "agent_prompt_legal_advisor",
    label: "الوكيل B: المستشار القانوني",
    desc: "يقدم استشارات في نظام العمل السعودي (صفحة /consultation)",
    icon: Scale,
    color: "text-amber-400",
  },
  {
    key: "agent_prompt_cv_assistant",
    label: "الوكيل C: مساعد السيرة الذاتية",
    desc: "يساعد المستخدمين في كتابة CV احترافي (صفحة /career-gift)",
    icon: Gift,
    color: "text-emerald-400",
  },
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
              <Button
                size="sm"
                variant="ghost"
                className="text-xs font-arabic gap-1 text-muted-foreground"
                onClick={() => resetToDefault(agent.key)}
              >
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
