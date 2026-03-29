import { FileText, Building2, MessageCircle, Brain, Activity, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AdminDashboardProps {
  stats: Record<string, number>;
  systemHealth: { ai: boolean | null; telegram: boolean | null; database: boolean | null };
  jobApps: any[];
  companyReqs: any[];
  consultations: any[];
}

const AdminDashboard = ({ stats, systemHealth, jobApps, companyReqs, consultations }: AdminDashboardProps) => {
  const statCards = [
    { label: "طلبات التوظيف", count: stats.job_applications || 0, icon: FileText, color: "text-blue-400" },
    { label: "طلبات الشركات", count: stats.company_requests || 0, icon: Building2, color: "text-emerald-400" },
    { label: "الاستشارات", count: stats.consultations || 0, icon: MessageCircle, color: "text-amber-400" },
    { label: "قاعدة المعرفة", count: stats.ai_knowledge_base || 0, icon: Brain, color: "text-purple-400" },
  ];

  // Activity chart data - last 7 days
  const chartData = (() => {
    const days: Record<string, { name: string; hiring: number; consultations: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = { name: d.toLocaleDateString("ar-SA", { weekday: "short" }), hiring: 0, consultations: 0 };
    }
    [...jobApps, ...companyReqs].forEach((item) => {
      const key = item.created_at?.slice(0, 10);
      if (days[key]) days[key].hiring++;
    });
    consultations.forEach((item) => {
      const key = item.created_at?.slice(0, 10);
      if (days[key]) days[key].consultations++;
    });
    return Object.values(days);
  })();

  const pieData = [
    { name: "توظيف", value: stats.job_applications || 0 },
    { name: "شركات", value: stats.company_requests || 0 },
    { name: "استشارات", value: stats.consultations || 0 },
  ];
  const PIE_COLORS = ["hsl(210, 80%, 60%)", "hsl(150, 60%, 50%)", "hsl(43, 65%, 52%)"];

  const StatusBadge = ({ ok }: { ok: boolean | null }) => {
    if (ok === null) return <Badge variant="outline" className="text-muted-foreground font-arabic"><Loader2 className="h-3 w-3 animate-spin ml-1" />جاري الفحص</Badge>;
    return ok ? (
      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-arabic"><CheckCircle className="h-3 w-3 ml-1" />متصل</Badge>
    ) : (
      <Badge className="bg-destructive/20 text-destructive border-destructive/30 font-arabic"><XCircle className="h-3 w-3 ml-1" />غير متصل</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-10 w-10 ${stat.color} opacity-80`} />
                <div className="text-left">
                  <p className="text-3xl font-bold text-foreground">{stat.count}</p>
                  <p className="text-xs text-muted-foreground font-arabic">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Health */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-arabic flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            حالة النظام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-arabic">الذكاء الاصطناعي:</span>
              <StatusBadge ok={systemHealth.ai} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-arabic">تيليجرام:</span>
              <StatusBadge ok={systemHealth.telegram} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-arabic">قاعدة البيانات:</span>
              <StatusBadge ok={systemHealth.database} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-arabic">النشاط - آخر 7 أيام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 40%, 22%)" />
                  <XAxis dataKey="name" stroke="hsl(210, 20%, 65%)" fontSize={12} />
                  <YAxis stroke="hsl(210, 20%, 65%)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(210, 100%, 8%)", border: "1px solid hsl(210, 40%, 22%)", borderRadius: 8, fontFamily: "Noto Kufi Arabic" }} />
                  <Bar dataKey="hiring" name="التوظيف" fill="hsl(210, 80%, 60%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="consultations" name="الاستشارات" fill="hsl(43, 65%, 52%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-arabic">توزيع الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(210, 100%, 8%)", border: "1px solid hsl(210, 40%, 22%)", borderRadius: 8, fontFamily: "Noto Kufi Arabic" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 -mt-4">
                {pieData.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-xs text-muted-foreground font-arabic">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
