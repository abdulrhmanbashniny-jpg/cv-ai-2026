import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Building2, MessageCircle, ExternalLink, MessageSquare, CheckCheck, Loader2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AdminInboxProps {
  jobApps: any[];
  companyReqs: any[];
  consultations: any[];
  loading: boolean;
  onRefresh: () => void;
}

const AdminInbox = ({ jobApps, companyReqs, consultations, loading, onRefresh }: AdminInboxProps) => {
  const [marking, setMarking] = useState<string | null>(null);

  const markHandled = async (table: string, id: string) => {
    setMarking(id);
    await supabase.functions.invoke("admin-data", {
      body: { action: "update", table, id, data: { status: "handled" } },
    });
    toast({ title: "تم", description: "تم تحديثه كمعالج" });
    setMarking(null);
    onRefresh();
  };

  const openWhatsApp = (phone: string) => {
    const clean = phone.replace(/\s/g, "").replace(/^0/, "966");
    window.open(`https://wa.me/${clean}`, "_blank");
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Tabs defaultValue="jobs">
      <TabsList className="bg-secondary/50 mb-6">
        <TabsTrigger value="jobs" className="font-arabic text-xs gap-1"><FileText className="h-3.5 w-3.5" />التوظيف ({jobApps.length})</TabsTrigger>
        <TabsTrigger value="companies" className="font-arabic text-xs gap-1"><Building2 className="h-3.5 w-3.5" />الشركات ({companyReqs.length})</TabsTrigger>
        <TabsTrigger value="consults" className="font-arabic text-xs gap-1"><MessageCircle className="h-3.5 w-3.5" />الاستشارات ({consultations.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="jobs">
        <div className="space-y-3">
          {jobApps.length === 0 && <p className="text-muted-foreground font-arabic text-center py-8">لا توجد طلبات</p>}
          {jobApps.map((app: any) => (
            <Card key={app.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{app.reference_number}</Badge>
                    <Badge className={app.status === "handled" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}>
                      {app.status === "handled" ? "معالج" : "جديد"}
                    </Badge>
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
                  <Button size="sm" variant="outline" className="text-xs font-arabic gap-1" onClick={() => openWhatsApp(app.phone)}>
                    <MessageSquare className="h-3 w-3" />واتساب
                  </Button>
                  {app.status !== "handled" && (
                    <Button size="sm" variant="outline" className="text-xs font-arabic gap-1 text-emerald-400 border-emerald-500/30" onClick={() => markHandled("job_applications", app.id)} disabled={marking === app.id}>
                      {marking === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
                      معالج
                    </Button>
                  )}
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
                    <Badge className={req.status === "handled" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}>
                      {req.status === "handled" ? "معالج" : "جديد"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold font-arabic text-foreground">{req.company_name}</h4>
                    <p className="text-sm text-muted-foreground font-arabic">{req.contact_person} • {req.contact_email}</p>
                    <p className="text-sm text-muted-foreground font-arabic">{req.hiring_needs}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="text-xs font-arabic gap-1" onClick={() => openWhatsApp(req.contact_phone)}>
                    <MessageSquare className="h-3 w-3" />واتساب
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs font-arabic gap-1" onClick={() => window.open(`mailto:${req.contact_email}`)}>
                    <ExternalLink className="h-3 w-3" />بريد
                  </Button>
                  {req.status !== "handled" && (
                    <Button size="sm" variant="outline" className="text-xs font-arabic gap-1 text-emerald-400 border-emerald-500/30" onClick={() => markHandled("company_requests", req.id)} disabled={marking === req.id}>
                      {marking === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
                      معالج
                    </Button>
                  )}
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
                    <Badge className={c.status === "handled" || c.status === "closed" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}>
                      {c.status === "handled" ? "معالج" : c.status === "closed" ? "مغلق" : "مفتوح"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold font-arabic text-foreground">{c.visitor_name || "زائر"}</h4>
                    <p className="text-sm text-muted-foreground font-arabic">{c.issue_category}</p>
                    {c.summary && <p className="text-sm text-muted-foreground font-arabic mt-1 line-clamp-2">{c.summary}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {c.status !== "handled" && (
                    <Button size="sm" variant="outline" className="text-xs font-arabic gap-1 text-emerald-400 border-emerald-500/30" onClick={() => markHandled("consultations", c.id)} disabled={marking === c.id}>
                      {marking === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
                      معالج
                    </Button>
                  )}
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
