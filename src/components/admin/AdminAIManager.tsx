import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit3, Check, X, Loader2, Brain, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AdminAIManagerProps {
  kbEntries: any[];
  chatLogs: any[];
  onRefresh: () => void;
}

const AdminAIManager = ({ kbEntries, chatLogs, onRefresh }: AdminAIManagerProps) => {
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [newCat, setNewCat] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");
  const [saving, setSaving] = useState(false);

  // Find unanswered user messages
  const unanswered = (() => {
    const userMsgs = chatLogs.filter((l: any) => l.role === "user");
    const kbQuestions = kbEntries.map((k: any) => k.question.toLowerCase());
    return userMsgs
      .filter((m: any) => !kbQuestions.some((q: string) => q.includes(m.message.toLowerCase()) || m.message.toLowerCase().includes(q)))
      .slice(0, 20);
  })();

  const addToKB = async () => {
    if (!newQ || !newA) return;
    setSaving(true);
    await supabase.functions.invoke("admin-data", {
      body: { action: "insert", table: "ai_knowledge_base", data: { question: newQ, answer: newA, category: newCat || null } },
    });
    toast({ title: "تم", description: "تمت إضافة السؤال لقاعدة المعرفة" });
    setNewQ(""); setNewA(""); setNewCat("");
    setSaving(false);
    onRefresh();
  };

  const deleteKB = async (id: string) => {
    await supabase.functions.invoke("admin-data", {
      body: { action: "delete", table: "ai_knowledge_base", id },
    });
    toast({ title: "تم", description: "تم الحذف" });
    onRefresh();
  };

  const updateKB = async (id: string) => {
    setSaving(true);
    await supabase.functions.invoke("admin-data", {
      body: { action: "update", table: "ai_knowledge_base", id, data: { question: editQ, answer: editA } },
    });
    toast({ title: "تم", description: "تم التحديث" });
    setEditingId(null);
    setSaving(false);
    onRefresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Unanswered Questions */}
      <div className="space-y-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-arabic flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-amber-400" />
              أسئلة بدون إجابة ({unanswered.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {unanswered.length === 0 && <p className="text-muted-foreground font-arabic text-sm text-center py-4">لا توجد أسئلة جديدة 🎉</p>}
              {unanswered.map((q: any, i: number) => (
                <div
                  key={i}
                  className="bg-secondary/30 rounded-lg p-3 cursor-pointer hover:border-primary/40 border border-transparent transition-colors"
                  onClick={() => setNewQ(q.message)}
                >
                  <p className="text-sm font-arabic text-foreground">{q.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(q.created_at).toLocaleDateString("ar-SA")}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add New */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-arabic flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              إضافة لقاعدة المعرفة
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
      </div>

      {/* Published Q&A */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-arabic flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            قاعدة المعرفة المنشورة ({kbEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
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
                  <>
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
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAIManager;
