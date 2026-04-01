import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Download, Loader2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Template = {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  gdrive_link: string;
  downloads_count: number;
  is_active: boolean;
  created_at: string;
};

const AdminStoreManager = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "hr", type: "free", gdrive_link: "" });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke("admin-data", { body: { table: "templates" } });
    setTemplates(data?.data || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditId(null);
    setForm({ title: "", description: "", category: "hr", type: "free", gdrive_link: "" });
    setDialogOpen(true);
  };

  const openEdit = (tpl: Template) => {
    setEditId(tpl.id);
    setForm({ title: tpl.title, description: tpl.description || "", category: tpl.category, type: tpl.type, gdrive_link: tpl.gdrive_link || "" });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast({ title: "خطأ", description: "العنوان مطلوب", variant: "destructive" }); return; }
    setSaving(true);
    if (editId) {
      await supabase.functions.invoke("admin-data", { body: { action: "update", table: "templates", id: editId, data: form } });
    } else {
      await supabase.functions.invoke("admin-data", { body: { action: "insert", table: "templates", data: form } });
    }
    setSaving(false);
    setDialogOpen(false);
    toast({ title: "تم", description: editId ? "تم التحديث" : "تمت الإضافة" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    await supabase.functions.invoke("admin-data", { body: { action: "delete", table: "templates", id } });
    toast({ title: "تم", description: "تم الحذف" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-arabic flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          مدير المتجر
        </h2>
        <Button onClick={openNew} className="bg-gold-shimmer text-primary-foreground font-arabic gap-2">
          <Plus className="h-4 w-4" /> إضافة نموذج
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-arabic text-right">العنوان</TableHead>
                  <TableHead className="font-arabic text-right">الفئة</TableHead>
                  <TableHead className="font-arabic text-right">النوع</TableHead>
                  <TableHead className="font-arabic text-right">التحميلات</TableHead>
                  <TableHead className="font-arabic text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((tpl) => (
                  <TableRow key={tpl.id}>
                    <TableCell className="font-arabic font-medium">{tpl.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-arabic">{tpl.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`font-arabic ${tpl.type === "free" ? "bg-green-600/20 text-green-400" : "bg-primary/20 text-primary"}`}>
                        {tpl.type === "free" ? "مجاني" : "مميز"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-muted-foreground"><Download className="h-3 w-3" /> {tpl.downloads_count}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(tpl)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(tpl.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {templates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground font-arabic py-10">لا توجد نماذج بعد</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-arabic">{editId ? "تعديل النموذج" : "إضافة نموذج جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block font-arabic text-xs text-muted-foreground mb-1">العنوان</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="font-arabic text-right" />
            </div>
            <div>
              <label className="block font-arabic text-xs text-muted-foreground mb-1">الوصف</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="font-arabic text-right" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-arabic text-xs text-muted-foreground mb-1">الفئة</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="font-arabic"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hr" className="font-arabic">موارد بشرية</SelectItem>
                    <SelectItem value="legal" className="font-arabic">قانوني</SelectItem>
                    <SelectItem value="general" className="font-arabic">عام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block font-arabic text-xs text-muted-foreground mb-1">النوع</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="font-arabic"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free" className="font-arabic">مجاني</SelectItem>
                    <SelectItem value="premium" className="font-arabic">مميز</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block font-arabic text-xs text-muted-foreground mb-1">رابط Google Drive</label>
              <Input value={form.gdrive_link} onChange={(e) => setForm({ ...form, gdrive_link: e.target.value })} className="text-left" dir="ltr" placeholder="https://drive.google.com/..." />
            </div>
            <Button onClick={save} disabled={saving} className="w-full bg-gold-shimmer text-primary-foreground font-arabic gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editId ? "تحديث" : "إضافة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStoreManager;
