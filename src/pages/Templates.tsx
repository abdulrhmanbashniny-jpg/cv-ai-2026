import { useState, useEffect } from "react";
import { Download, Lock, FileText, Scale, Briefcase, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LeadCaptureModal from "@/components/LeadCaptureModal";
import ThankYouModal from "@/components/ThankYouModal";
import TemplateArchitectChat from "@/components/TemplateArchitectChat";
import { Loader2 } from "lucide-react";

type Template = {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  downloads_count: number;
  is_active: boolean;
};

const CATEGORIES = [
  { key: "all", ar: "الكل", en: "All", icon: Filter },
  { key: "hr", ar: "موارد بشرية", en: "HR", icon: Briefcase },
  { key: "legal", ar: "قانوني", en: "Legal", icon: Scale },
  { key: "free", ar: "مجاني", en: "Free", icon: Download },
  { key: "premium", ar: "مميز", en: "Premium", icon: Lock },
];

const Templates = () => {
  const { t, lang } = useLanguage();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [thankYouOpen, setThankYouOpen] = useState(false);
  const [thankYouData, setThankYouData] = useState<{ title: string; url?: string }>({ title: "" });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data } = await supabase
        .from("templates")
        .select("id, title, description, category, type, downloads_count, is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setTemplates((data as Template[]) || []);
    } catch {}
    setLoading(false);
  };

  const filtered = templates.filter((t) => {
    if (filter === "all") return true;
    if (filter === "free") return t.type === "free";
    if (filter === "premium") return t.type === "premium";
    return t.category === filter;
  });

  const handleAISearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResult("");
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: `المستخدم يبحث عن نموذج إداري مناسب. مشكلته/سؤاله: "${aiQuery}". بناءً على النماذج المتاحة في المتجر، اقترح النموذج الأنسب وسبب الاقتراح بإيجاز. النماذج المتاحة: ${templates.map((t) => `"${t.title}" (${t.category}, ${t.type})`).join(", ")}` }],
          agent: "career_twin",
          session_id: "ai-matchmaker-" + Date.now(),
        }),
      });

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line.slice(6).trim() !== "[DONE]") {
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                result += content;
                setAiResult(result);
              }
            } catch {}
          }
        }
      }
    } catch {
      setAiResult(t("عذراً، حدث خطأ. حاول مرة أخرى.", "Sorry, an error occurred. Try again."));
    }
    setAiLoading(false);
  };

  const handleDownload = (template: Template) => {
    setSelectedTemplate(template);
    setLeadModalOpen(true);
  };

  const handleLeadSuccess = (result: any) => {
    if (result.type === "free" && result.download_url) {
      setThankYouData({ title: result.template_title, url: result.download_url });
      setThankYouOpen(true);
      loadTemplates();
    } else if (result.type === "premium") {
      // Show success message instead of WhatsApp redirect
      setThankYouData({ title: result.template_title });
      setThankYouOpen(true);
      loadTemplates();
    }
  };

  const getCategoryIcon = (cat: string) => {
    if (cat === "hr") return <Briefcase className="h-4 w-4" />;
    if (cat === "legal") return <Scale className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className={`min-h-screen bg-navy-gradient ${lang === "ar" ? "" : ""}`} dir={lang === "ar" ? "rtl" : "ltr"}>
      <Navbar />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-6 text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold font-arabic text-foreground mb-4">
            {t("النماذج الإدارية", "Administrative Templates")}
          </h1>
          <p className="text-muted-foreground font-arabic max-w-2xl mx-auto mb-8">
            {t(
              "مكتبة شاملة من النماذج الإدارية والقانونية المعدة بمعايير احترافية. حمّل مجاناً أو احصل على النسخة المميزة.",
              "A comprehensive library of administrative and legal templates prepared with professional standards."
            )}
          </p>

          {/* AI Template Architect Chat */}
          <TemplateArchitectChat />
        </section>

        {/* Filters */}
        <section className="container mx-auto px-6 mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.key}
                variant={filter === cat.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(cat.key)}
                className="font-arabic gap-2"
              >
                <cat.icon className="h-3.5 w-3.5" />
                {lang === "ar" ? cat.ar : cat.en}
              </Button>
            ))}
          </div>
        </section>

        {/* Grid */}
        <section className="container mx-auto px-6">
          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-arabic">{t("لا توجد نماذج حالياً", "No templates available")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((tpl) => (
                <Card key={tpl.id} className="border-border/50 bg-card hover:border-primary/30 transition-all group overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(tpl.category)}
                        <Badge variant="outline" className="font-arabic text-xs">
                          {tpl.category === "hr" ? t("موارد بشرية", "HR") : tpl.category === "legal" ? t("قانوني", "Legal") : tpl.category}
                        </Badge>
                      </div>
                      <Badge className={`font-arabic text-xs ${tpl.type === "free" ? "bg-green-600/20 text-green-400 border-green-600/30" : "bg-primary/20 text-primary border-primary/30"}`}>
                        {tpl.type === "free" ? t("مجاني", "Free") : t("مميز", "Premium")}
                      </Badge>
                    </div>
                    <h3 className="font-arabic font-bold text-foreground mt-2 group-hover:text-primary transition-colors">
                      {tpl.title}
                    </h3>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground font-arabic line-clamp-2">
                      {tpl.description}
                    </p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between pt-3 border-t border-border/30">
                    <span className="text-xs text-muted-foreground font-arabic flex items-center gap-1">
                      <Download className="h-3 w-3" /> {tpl.downloads_count} {t("تحميل", "downloads")}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleDownload(tpl)}
                      className={`font-arabic gap-2 ${tpl.type === "free" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gold-shimmer text-primary-foreground"}`}
                    >
                      {tpl.type === "free" ? (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          {t("تحميل مجاني", "Free Download")}
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          {t("اطلب النموذج 🔒", "Request Template 🔒")}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />

      <LeadCaptureModal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        template={selectedTemplate}
        onSuccess={handleLeadSuccess}
      />
      <ThankYouModal
        open={thankYouOpen}
        onClose={() => setThankYouOpen(false)}
        templateTitle={thankYouData.title}
        downloadUrl={thankYouData.url}
      />
    </div>
  );
};

export default Templates;
