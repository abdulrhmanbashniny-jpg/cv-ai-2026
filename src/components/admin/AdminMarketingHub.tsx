import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Download as DownloadIcon, Loader2, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  downloads_count: number;
  created_at: string;
};

const AdminMarketingHub = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke("admin-data", { body: { table: "leads" } });
    setLeads(data?.data || []);
    setLoading(false);
  };

  const exportCSV = () => {
    if (leads.length === 0) { toast({ title: "لا توجد بيانات", variant: "destructive" }); return; }
    const headers = ["الاسم", "البريد", "الجوال", "الدور", "التحميلات", "تاريخ التسجيل"];
    const rows = leads.map((l) => [l.name, l.email, l.phone, l.role, String(l.downloads_count), new Date(l.created_at).toLocaleDateString("ar-SA")]);
    const bom = "\uFEFF";
    const csv = bom + [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "تم", description: "تم تصدير البيانات" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-arabic flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          مركز التسويق — العملاء المحتملون
        </h2>
        <Button onClick={exportCSV} variant="outline" className="font-arabic gap-2">
          <FileDown className="h-4 w-4" /> تصدير CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{leads.length}</p>
            <p className="text-xs text-muted-foreground font-arabic mt-1">إجمالي العملاء</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-400">{leads.filter((l) => l.downloads_count > 3).length}</p>
            <p className="text-xs text-muted-foreground font-arabic mt-1">عملاء ساخنون (3+ تحميلات)</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{leads.reduce((a, l) => a + l.downloads_count, 0)}</p>
            <p className="text-xs text-muted-foreground font-arabic mt-1">إجمالي التحميلات</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-arabic text-right">الاسم</TableHead>
                  <TableHead className="font-arabic text-right">البريد</TableHead>
                  <TableHead className="font-arabic text-right">الجوال</TableHead>
                  <TableHead className="font-arabic text-right">الدور</TableHead>
                  <TableHead className="font-arabic text-right">التحميلات</TableHead>
                  <TableHead className="font-arabic text-right">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-arabic font-medium">{lead.name}</TableCell>
                    <TableCell className="text-sm">{lead.email}</TableCell>
                    <TableCell className="text-sm" dir="ltr">{lead.phone}</TableCell>
                    <TableCell><Badge variant="outline" className="font-arabic">{lead.role}</Badge></TableCell>
                    <TableCell>
                      <span className={`flex items-center gap-1 ${lead.downloads_count > 3 ? "text-green-400 font-bold" : "text-muted-foreground"}`}>
                        <DownloadIcon className="h-3 w-3" /> {lead.downloads_count}
                        {lead.downloads_count > 3 && <span className="text-xs">🔥</span>}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(lead.created_at).toLocaleDateString("ar-SA")}</TableCell>
                  </TableRow>
                ))}
                {leads.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground font-arabic py-10">لا يوجد عملاء محتملون بعد</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMarketingHub;
