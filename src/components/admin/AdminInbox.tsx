import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Building2, MessageCircle, ExternalLink, MessageSquare, Loader2, Eye, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AdminInboxProps {
  jobApps: any[];
  companyReqs: any[];
  consultations: any[];
  loading: boolean;
  onRefresh: () => void;
}

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  pending: { label: "جديد", class: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  in_progress: { label: "قيد المعالجة", class: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  handled: { label: "تم الحل", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  resolved: { label: "تم الحل", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
};

const AdminInbox = ({ jobApps, companyReqs, consultations, loading, onRefresh }: AdminInboxProps) => {
  const [updating, setUpdating] = useState<string | null>(null);

  const updateStatus = async (table: string, id: string, status: string) => {
    setUpdating(id);
    await supabase.functions.invoke("admin-data", {
      body: { action: "update", table, id, data: { status } },
    });
    toast({ title: "تم", description: "تم تحديث الحالة" });
    setUpdating(null);
    onRefresh();
  };

  const openWhatsApp = (phone: string, table: string, id: string, currentStatus: string) => {
    const clean = phone.replace(/\s/g, "").replace(/^0/, "966");
    window.open(`https://wa.me/${clean}`, "_blank");
    if (currentStatus === "pending") {
      updateStatus(table, id, "in_progress");
    }
  };

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({ title: "لا توجد بيانات", variant: "destructive" });
      return;
    }
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((h) => {
          const val = String(row[h] ?? "").replace(/"/g, '""');
          return `"${val}"`;
        }).join(",")
      ),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "تم", description: "تم تصدير الملف" });
  };

  const StatusSelect = ({ value, table, id }: { value: string; table: string; id: string }) => (
    <Select value={value} onValueChange={(v) => updateStatus(table, id, v)} disabled={updating === id}>
      <SelectTrigger className="h-7 w-28 text-[10px] font-arabic">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending" className="font-arabic text-xs">جديد</SelectItem>
        <SelectItem value="in_progress" className="font-arabic text-xs">قيد المعالجة</SelectItem>
        <SelectItem value="handled" className="font-arabic text-xs">تم الحل</SelectItem>
      </SelectContent>
    </Select>
  );

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Tabs defaultValue="jobs">
      <div className="flex items-center justify-between mb-6">
        <Button size="sm" variant="outline" className="text-xs font-arabic gap-1" onClick={() => {
          const activeTab = document.querySelector('[data-state="active"][role="tab"]')?.getAttribute("value");
          if (activeTab === "jobs") exportCSV(jobApps, "job_applications");
          else if (activeTab === "companies") exportCSV(companyReqs, "company_requests");
          else exportCSV(consultations, "consultations");
        }}>
          <Download className="h-3 w-3" />
          تصدير CSV
        </Button>
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="jobs" className="font-arabic text-xs gap-1"><FileText className="h-3.5 w-3.5" />التوظيف ({jobApps.length})</TabsTrigger>
          <TabsTrigger value="companies" className="font-arabic text-xs gap-1"><Building2 className="h-3.5 w-3.5" />الشركات ({companyReqs.length})</TabsTrigger>
          <TabsTrigger value="consults" className="font-arabic text-xs gap-1"><MessageCircle className="h-3.5 w-3.5" />الاستشارات ({consultations.length})</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="jobs">
        <div className="space-y-3">
          {jobApps.length === 0 && <p className="text-muted-foreground font-arabic text-center py-8">لا توجد طلبات</p>}
          {jobApps.map((app: any) => (
            <Card key={app.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{app.reference_number}</Badge>
                    <StatusSelect value={app.status || "pending"} table="job_applications" id={app.id} />
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold font-arabic text-foreground">{app.full_name}</h4>
                    <p className="text-sm text-muted-foreground font-arabic">{app.city} • {app.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {app.cv_url && (
                    <Button size="sm" variant="outline" className="text-xs font-arabic gap-1" onClick={() => {
                      const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/cv-uploads/${app.cv_url}`;
                      window.open(url, "_blank");
                    }}>
                      <Eye className="h-3 w-3" />عرض CV
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-xs font-arabic gap-1" onClick={() => openWhatsApp(app.phone, "job_applications", app.id, app.status)}>
                    <MessageSquare className="h-3 w-3" />واتساب
                  </Button>
                  <span className="text-xs text-muted-foreground mr-auto">{new Date(app.created_at).toLocaleDateString("ar-SA")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="companies">
        <div className="space-y-3">
          {companyReqs.length === 0 && <p className="text-muted-foreground font-arabic text-center py-8">لا توجد طلبات</p>}
          {companyReqs.map((req: any) => (
            <Card key={req.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{req.reference_number}</Badge>
                    <StatusSelect value={req.status || "pending"} table="company_requests" id={req.id} />
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold font-arabic text-foreground">{req.company_name}</h4>
                    <p className="text-sm text-muted-foreground font-arabic">{req.contact_person} • {req.contact_email}</p>
                    <p className="text-sm text-muted-foreground font-arabic">{req.hiring_needs}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="text-xs font-arabic gap-1" onClick={() => openWhatsApp(req.contact_phone, "company_requests", req.id, req.status)}>
                    <MessageSquare className="h-3 w-3" />واتساب
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs font-arabic gap-1" onClick={() => window.open(`mailto:${req.contact_email}`)}>
                    <ExternalLink className="h-3 w-3" />بريد
                  </Button>
                  <span className="text-xs text-muted-foreground mr-auto">{new Date(req.created_at).toLocaleDateString("ar-SA")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="consults">
        <div className="space-y-3">
          {consultations.length === 0 && <p className="text-muted-foreground font-arabic text-center py-8">لا توجد استشارات</p>}
          {consultations.map((c: any) => (
            <Card key={c.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{c.reference_number}</Badge>
                    {c.needs_human_review && <Badge className="bg-destructive/20 text-destructive border-destructive/30 font-arabic">يحتاج مراجعة</Badge>}
                    <StatusSelect value={c.status || "open"} table="consultations" id={c.id} />
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold font-arabic text-foreground">{c.visitor_name || "زائر"}</h4>
                    <p className="text-sm text-muted-foreground font-arabic">{c.issue_category}</p>
                    {c.summary && <p className="text-sm text-muted-foreground font-arabic mt-1 line-clamp-2">{c.summary}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground mr-auto">{new Date(c.created_at).toLocaleDateString("ar-SA")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default AdminInbox;
