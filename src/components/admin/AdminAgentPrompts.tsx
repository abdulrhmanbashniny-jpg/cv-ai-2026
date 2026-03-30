import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, Bot, Scale, Gift } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AdminAgentPromptsProps {
  settings: Record<string, string>;
  onSave: (data: { setting_key: string; setting_value: string }[]) => Promise<void>;
}

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
      init[a.key] = settings[a.key] || "";
    });
    return init;
  });
  const [saving, setSaving] = useState(false);

  const savePrompts = async () => {
    setSaving(true);
    const data = agents
      .filter((a) => prompts[a.key]?.trim())
      .map((a) => ({
        setting_key: a.key,
        setting_value: prompts[a.key],
      }));
    if (data.length > 0) {
      await onSave(data);
    }
    setSaving(false);
    toast({ title: "تم", description: "تم حفظ إعدادات الوكلاء" });
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground font-arabic text-sm">
        يمكنك تخصيص System Prompt لكل وكيل ذكاء اصطناعي. اترك الحقل فارغاً لاستخدام البرومبت الافتراضي.
      </p>

      {agents.map((agent) => (
        <Card key={agent.key} className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-arabic flex items-center gap-2">
              <agent.icon className={`h-4 w-4 ${agent.color}`} />
              {agent.label}
            </CardTitle>
            <p className="text-xs text-muted-foreground font-arabic">{agent.desc}</p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={prompts[agent.key]}
              onChange={(e) => setPrompts((p) => ({ ...p, [agent.key]: e.target.value }))}
              placeholder="اترك فارغاً لاستخدام البرومبت الافتراضي..."
              className="text-right font-arabic text-sm"
              rows={6}
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
