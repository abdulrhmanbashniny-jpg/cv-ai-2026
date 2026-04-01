import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface LeadCaptureModalProps {
  open: boolean;
  onClose: () => void;
  template: { id: string; title: string; type: string } | null;
  onSuccess: (result: { type: string; download_url?: string; whatsapp_url?: string; template_title: string }) => void;
}

const ROLES = ["موظف", "إداري", "موارد بشرية", "صاحب عمل"];

const LeadCaptureModal = ({ open, onClose, template, onSuccess }: LeadCaptureModalProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const validatePhone = (val: string) => {
    const clean = val.replace(/\D/g, "");
    setPhone(clean);
    if (clean && !/^9665[0-9]{8}$/.test(clean)) {
      setPhoneError(t("رقم الجوال يجب أن يبدأ بـ 9665 ويتكون من 12 رقم", "Phone must start with 9665 and be 12 digits"));
    } else {
      setPhoneError("");
    }
  };

  const handleSubmit = async () => {
    if (!template) return;
    if (!name.trim() || !email.trim() || !phone.trim() || !role) {
      toast({ title: t("خطأ", "Error"), description: t("جميع الحقول مطلوبة", "All fields are required"), variant: "destructive" });
      return;
    }
    if (!/^9665[0-9]{8}$/.test(phone)) {
      setPhoneError(t("رقم الجوال يجب أن يبدأ بـ 9665 ويتكون من 12 رقم", "Phone must start with 9665 and be 12 digits"));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("template-download", {
        body: { template_id: template.id, name: name.trim(), email: email.trim(), phone, role },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      onSuccess(data);
      setName(""); setEmail(""); setPhone(""); setRole("");
      onClose();
    } catch (e: any) {
      toast({ title: t("خطأ", "Error"), description: e.message || t("حدث خطأ", "An error occurred"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-arabic text-center flex items-center justify-center gap-2">
            {template?.type === "premium" ? <Lock className="h-5 w-5 text-primary" /> : <Download className="h-5 w-5 text-green-500" />}
            {template?.type === "premium"
              ? t("طلب نموذج مميز", "Request Premium Template")
              : t("تحميل مجاني", "Free Download")}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground font-arabic text-center mb-2">
          {t(`للحصول على "${template?.title}"، أدخل بياناتك:`, `To get "${template?.title}", enter your details:`)}
        </p>
        <div className="space-y-3">
          <Input placeholder={t("الاسم الكامل", "Full Name")} value={name} onChange={(e) => setName(e.target.value)} className="font-arabic text-right" />
          <Input placeholder={t("البريد الإلكتروني", "Email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="font-arabic text-right" />
          <div>
            <Input placeholder="9665XXXXXXXX" value={phone} onChange={(e) => validatePhone(e.target.value)} className="font-arabic text-right" dir="ltr" />
            {phoneError && <p className="text-destructive text-xs font-arabic mt-1">{phoneError}</p>}
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="font-arabic text-right">
              <SelectValue placeholder={t("الدور الوظيفي", "Job Role")} />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r} className="font-arabic">{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSubmit} disabled={loading} className="w-full bg-gold-shimmer text-primary-foreground font-arabic gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : template?.type === "premium" ? <Lock className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {template?.type === "premium" ? t("إرسال الطلب عبر واتساب", "Send Request via WhatsApp") : t("تحميل الآن", "Download Now")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadCaptureModal;
