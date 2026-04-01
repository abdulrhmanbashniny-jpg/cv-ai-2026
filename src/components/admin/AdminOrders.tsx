import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, CheckCircle, Loader2, ExternalLink, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke("admin-data", { body: { table: "premium_orders" } });
    setOrders(data?.data || []);
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, []);

  const markAsPaid = async (order: any) => {
    setMarking(order.id);
    await supabase.functions.invoke("admin-data", {
      body: { action: "update", table: "premium_orders", id: order.id, data: { status: "paid", paid_at: new Date().toISOString() } },
    });

    // Open WhatsApp with delivery message
    const msg = encodeURIComponent(
      `أهلاً بك أستاذ ${order.customer_name}، معك عبدالرحمن بشنيني صاحب منصة الخدمات الإدارية للموارد البشرية. بخصوص طلبك لنموذج "${order.template_name}"، يسعدني تزويدك بالتفاصيل...`
    );
    window.open(`https://wa.me/${order.customer_phone}?text=${msg}`, "_blank");

    toast({ title: "تم", description: "تم تحديث حالة الطلب وفتح واتساب" });
    setMarking(null);
    loadOrders();
  };

  const pending = orders.filter((o) => o.status === "pending");
  const paid = orders.filter((o) => o.status === "paid");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-amber-400" />
            <div>
              <p className="text-2xl font-bold text-foreground">{pending.length}</p>
              <p className="text-xs text-muted-foreground font-arabic">طلبات معلقة</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-foreground">{paid.length}</p>
              <p className="text-xs text-muted-foreground font-arabic">تم التسليم</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-arabic flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> طلبات النماذج المميزة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground font-arabic text-sm text-center py-8">لا توجد طلبات حتى الآن</p>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="bg-secondary/20 rounded-lg p-4 border border-border/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-2">
                        {order.status === "pending" && (
                          <Button size="sm" onClick={() => markAsPaid(order)} disabled={marking === order.id}
                            className="bg-green-600 hover:bg-green-700 text-white font-arabic gap-1 text-xs">
                            {marking === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                            تم الدفع - تسليم
                          </Button>
                        )}
                        <a href={`https://wa.me/${order.customer_phone}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="font-arabic gap-1 text-xs">
                            <ExternalLink className="h-3 w-3" /> واتساب
                          </Button>
                        </a>
                      </div>
                      <div className="text-right flex-1">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <Badge variant={order.status === "paid" ? "default" : "secondary"} className="text-xs font-arabic">
                            {order.status === "paid" ? "تم التسليم" : "معلق"}
                          </Badge>
                          <span className="font-arabic text-sm font-bold text-foreground">{order.customer_name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-arabic">📦 {order.template_name}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-1">📞 {order.customer_phone}</p>
                        {order.customer_email && <p className="text-xs text-muted-foreground mt-0.5">📧 {order.customer_email}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(order.created_at).toLocaleDateString("ar-SA")} - {new Date(order.created_at).toLocaleTimeString("ar-SA")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrders;
