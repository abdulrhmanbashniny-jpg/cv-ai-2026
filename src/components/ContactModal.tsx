import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ContactModal = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [consentError, setConsentError] = useState(false);

  const handleSubmit = async () => {
    if (!name || !reason) {
      toast({ title: "خطأ", description: "الاسم والسبب مطلوبان", variant: "destructive" });
      return;
    }
    if (!consent) {
      setConsentError(true);
      return;
    }
    setConsentError(false);
    setSending(true);
    try {
      await supabase.functions.invoke("admin-data", {
        body: {
          action: "insert",
          table: "contact_requests",
          data: { full_name: name, email: email || null, phone: phone || null, reason },
        },
      });

      supabase.functions.invoke("notify-telegram", {
        body: {
          type: "contact_us",
          data: { full_name: name, email, phone, reason },
        },
      }).catch(() => {});

      toast({ title: "تم الإرسال!", description: "سنتواصل معك قريباً" });
      setName(""); setEmail(""); setPhone(""); setReason(""); setConsent(false);
      setOpen(false);
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الإرسال", variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="font-arabic gap-2 border-primary/30 hover:bg-primary/10">
          <MessageCircle className="h-4 w-4" />
          تواصل معنا
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-arabic text-right">تواصل معنا</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block font-arabic text-xs text-muted-foreground mb-1">الاسم *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="text-right font-arabic" placeholder="الاسم الكامل" />
          </div>
          <div>
            <label className="block font-arabic text-xs text-muted-foreground mb-1">البريد الإلكتروني</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="font-mono text-sm" dir="ltr" placeholder="email@example.com" />
          </div>
          <div>
            <label className="block font-arabic text-xs text-muted-foreground mb-1">رقم الهاتف</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="font-mono text-sm" dir="ltr" placeholder="+966..." />
          </div>
          <div>
            <label className="block font-arabic text-xs text-muted-foreground mb-1">سبب التواصل *</label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="text-right font-arabic" rows={3} placeholder="كيف يمكننا مساعدتك؟" />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="contact-consent"
              checked={consent}
              onCheckedChange={(v) => setConsent(v === true)}
              className="mt-1"
            />
            <label htmlFor="contact-consent" className="text-xs text-muted-foreground font-arabic leading-relaxed cursor-pointer">
              أوافق على{" "}
              <a href="/privacy-policy" target="_blank" className="text-primary underline hover:opacity-80">
                سياسة الخصوصية
              </a>{" "}
              ومعالجة بياناتي وفقاً لنظام حماية البيانات الشخصية.
            </label>
          </div>
          {consentError && (
            <p className="text-destructive text-xs font-arabic text-center">يجب الموافقة على سياسة الخصوصية أولاً</p>
          )}
          <Button onClick={handleSubmit} disabled={sending} className="w-full bg-gold-shimmer text-primary-foreground font-arabic gap-2">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            إرسال
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactModal;
