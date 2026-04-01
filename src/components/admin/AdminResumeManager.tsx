import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, Loader2, FileUser, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PortfolioItem {
  id: string;
  content_key: string;
  content_ar: string | null;
  content_en: string | null;
  category: string;
}

const AdminResumeManager = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedItems, setEditedItems] = useState<Record<string, { content_ar: string; content_en: string }>>({});

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("admin-data", {
        body: { table: "portfolio_content" },
      });
      setItems(data?.data || []);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل المحتوى", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleChange = (id: string, field: "content_ar" | "content_en", value: string) => {
    const item = items.find((i) => i.id === id);
    setEditedItems((prev) => ({
      ...prev,
      [id]: {
        content_ar: prev[id]?.content_ar ?? item?.content_ar ?? "",
        content_en: prev[id]?.content_en ?? item?.content_en ?? "",
        [field]: value,
      },
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(editedItems).map(([id, vals]) => ({
        id,
        ...vals,
      }));
      
      for (const update of updates) {
        await supabase.functions.invoke("admin-data", {
          body: {
            action: "update_portfolio",
            data: update,
          },
        });
      }
      
      setEditedItems({});
      await fetchContent();
      toast({ title: "تم الحفظ", description: "تم تحديث المحتوى بنجاح" });
    } catch {
      toast({ title: "خطأ", description: "فشل حفظ التغييرات", variant: "destructive" });
    }
    setSaving(false);
  };

  const categoryLabels: Record<string, string> = {
    general: "معلومات عامة / General Info",
    experience: "الخبرات المهنية / Experience",
    skills: "المهارات / Skills",
  };

  const groupedItems = items.reduce<Record<string, PortfolioItem[]>>((acc, item) => {
    const cat = item.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileUser className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold font-arabic text-foreground">مدير السيرة الذاتية</h2>
        </div>
        <Button
          onClick={saveAll}
          disabled={saving || Object.keys(editedItems).length === 0}
          className="bg-gold-shimmer text-primary-foreground font-arabic gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ التغييرات
        </Button>
      </div>

      <p className="text-muted-foreground font-arabic text-sm">
        عدّل محتوى السيرة الذاتية بالعربية والإنجليزية. التغييرات ستظهر فوراً على الموقع وسيتم مزامنتها تلقائياً مع التوأم الذكي.
      </p>

      {Object.entries(groupedItems).map(([category, catItems]) => (
        <Card key={category} className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-arabic text-primary">
              {categoryLabels[category] || category}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {catItems.map((item) => {
              const edited = editedItems[item.id];
              return (
                <div key={item.id} className="border border-border/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono">{item.content_key}</span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground font-arabic mb-1">العربية</label>
                      <Textarea
                        value={edited?.content_ar ?? item.content_ar ?? ""}
                        onChange={(e) => handleChange(item.id, "content_ar", e.target.value)}
                        className="text-right font-arabic text-sm min-h-[80px]"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">English</label>
                      <Textarea
                        value={edited?.content_en ?? item.content_en ?? ""}
                        onChange={(e) => handleChange(item.id, "content_en", e.target.value)}
                        className="text-left text-sm min-h-[80px]"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminResumeManager;
