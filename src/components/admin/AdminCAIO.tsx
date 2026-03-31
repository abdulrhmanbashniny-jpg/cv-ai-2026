import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, FileText, TrendingUp, Lightbulb, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface AdminCAIOProps {
  chatLogs: any[];
  consultations: any[];
  jobApps: any[];
  companyReqs: any[];
  contactMessages: any[];
}

const AdminCAIO = ({ chatLogs, consultations, jobApps, companyReqs, contactMessages }: AdminCAIOProps) => {
  const [report, setReport] = useState("");
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    setGenerating(true);
    setReport("");

    try {
      // Prepare analytics data summary
      const totalChats = chatLogs.length;
      const totalConsultations = consultations.length;
      const totalJobApps = jobApps.length;
      const totalCompanyReqs = companyReqs.length;
      const totalContacts = contactMessages.length;

      // Recent user questions (last 50)
      const recentUserMessages = chatLogs
        .filter((l: any) => l.role === "user")
        .slice(-50)
        .map((l: any) => l.message)
        .join("\n- ");

      // Recent consultation categories
      const categories = consultations.reduce((acc: Record<string, number>, c: any) => {
        acc[c.issue_category] = (acc[c.issue_category] || 0) + 1;
        return acc;
      }, {});

      const needsReview = consultations.filter((c: any) => c.needs_human_review).length;

      // Recent assistant responses for evaluation
      const recentAssistantMessages = chatLogs
        .filter((l: any) => l.role === "assistant")
        .slice(-30)
        .map((l: any) => l.message.slice(0, 200))
        .join("\n---\n");

      const analyticsPrompt = `أنت كبير مسؤولي الذكاء الاصطناعي (CAIO) لمنصة عبدالرحمن باشنيني. قم بتحليل البيانات التالية وأنشئ تقريراً تنفيذياً باللغة العربية.

## بيانات المنصة:
- إجمالي المحادثات: ${totalChats}
- إجمالي الاستشارات: ${totalConsultations}
- طلبات التوظيف: ${totalJobApps}
- طلبات الشركات: ${totalCompanyReqs}
- رسائل التواصل: ${totalContacts}
- استشارات تحتاج مراجعة بشرية: ${needsReview}

## فئات الاستشارات:
${Object.entries(categories).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

## آخر أسئلة المستخدمين:
- ${recentUserMessages || "لا توجد أسئلة حتى الآن"}

## عينة من ردود الوكلاء:
${recentAssistantMessages || "لا توجد ردود حتى الآن"}

---

أنشئ تقريراً تنفيذياً بـ 3 أقسام:

### 1. تقييم أداء الوكلاء
حلل جودة الردود، هل الوكلاء يجيبون بشكل دقيق؟ هل هناك أنماط ضعف؟

### 2. اقتراحات تحسين البرومبت
اقترح نصوص محددة (بالعربي) يمكن إضافتها إلى System Prompt لتحسين الأداء بناءً على أسئلة المستخدمين الفعلية.

### 3. رؤى الجمهور واقتراحات الأعمال
حلل حجم الجلسات، الأسئلة الشائعة، واقترح إجراءات عمل (مثال: "حركة عالية على المستشار العمالي اليوم، يُقترح إضافة مقال عن مكافأة نهاية الخدمة").`;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: analyticsPrompt }],
            agent: "career_twin",
          }),
        }
      );

      if (!resp.ok) throw new Error("فشل في إنشاء التقرير");

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullReport = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullReport += content;
              setReport(fullReport);
            }
          } catch { /* partial */ }
        }
      }
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message || "فشل في إنشاء التقرير", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  // Quick stats
  const userMsgCount = chatLogs.filter((l: any) => l.role === "user").length;
  const assistantMsgCount = chatLogs.filter((l: any) => l.role === "assistant").length;
  const reviewNeeded = consultations.filter((c: any) => c.needs_human_review).length;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-foreground">{userMsgCount}</p>
              <p className="text-xs text-muted-foreground font-arabic">رسائل المستخدمين</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-foreground">{assistantMsgCount}</p>
              <p className="text-xs text-muted-foreground font-arabic">ردود الوكلاء</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-emerald-400" />
            <div>
              <p className="text-2xl font-bold text-foreground">{consultations.length}</p>
              <p className="text-xs text-muted-foreground font-arabic">إجمالي الاستشارات</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Lightbulb className="h-8 w-8 text-amber-400" />
            <div>
              <p className="text-2xl font-bold text-foreground">{reviewNeeded}</p>
              <p className="text-xs text-muted-foreground font-arabic">تحتاج مراجعة بشرية</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Report */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-arabic flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              التقرير التنفيذي للذكاء الاصطناعي
            </CardTitle>
            <Button
              onClick={generateReport}
              disabled={generating}
              className="bg-gold-shimmer text-primary-foreground font-arabic gap-2"
              size="sm"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              إنشاء التقرير التنفيذي
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {report ? (
            <div className="bg-secondary/30 rounded-xl p-6 font-arabic text-sm prose prose-sm prose-invert max-w-none" dir="rtl">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground font-arabic">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>اضغط على "إنشاء التقرير التنفيذي" لتحليل بيانات المنصة</p>
              <p className="text-xs mt-2">سيقوم الذكاء الاصطناعي بتحليل سجلات المحادثات والنماذج وتقديم توصيات</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCAIO;
