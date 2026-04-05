import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Phone } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const ROLES = [
  { value: "موظف", label: "موظف" },
  { value: "صاحب منشأة", label: "صاحب منشأة" },
  { value: "باحث عن عمل", label: "باحث عن عمل" },
  { value: "أخرى", label: "أخرى" },
];

interface PreChatFormProps {
  onSubmit: (data: { name: string; phone: string; role: string; sessionId: string }) => void;
  title?: string;
  extraFields?: React.ReactNode;
}

const PreChatForm = ({ onSubmit, title = "قبل أن نبدأ", extraFields }: PreChatFormProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim() || !role) return;
    if (!consent) {
      setConsentError(true);
      return;
    }
    setConsentError(false);
    const sessionId = uuidv4();
    onSubmit({ name: name.trim(), phone: phone.trim(), role, sessionId });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-arabic font-bold text-foreground text-center text-lg">{title}</h3>
      <p className="text-xs text-muted-foreground font-arabic text-center">
        يرجى إدخال بياناتك لبدء المحادثة
      </p>
      <div>
        <label className="block font-arabic text-xs text-muted-foreground mb-1">الاسم *</label>
        <div className="relative">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-right font-arabic pr-9"
            placeholder="الاسم الكامل"
          />
          <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div>
        <label className="block font-arabic text-xs text-muted-foreground mb-1">رقم الجوال *</label>
        <div className="relative">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="font-mono text-sm pr-9"
            dir="ltr"
            placeholder="05XXXXXXXX"
          />
          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div>
        <label className="block font-arabic text-xs text-muted-foreground mb-1">الصفة / نوع الجهة *</label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="text-right font-arabic">
            <SelectValue placeholder="اختر صفتك" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value} className="font-arabic">{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {extraFields}
      <div className="flex items-start gap-2">
        <Checkbox
          id="pdpl-consent"
          checked={consent}
          onCheckedChange={(v) => { setConsent(v === true); if (v === true) setConsentError(false); }}
          className="mt-1"
        />
        <label htmlFor="pdpl-consent" className="text-xs text-muted-foreground font-arabic leading-relaxed cursor-pointer">
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
      <Button
        onClick={handleSubmit}
        disabled={!name.trim() || !phone.trim() || !role}
        className="w-full bg-gold-shimmer text-primary-foreground font-arabic glow-gold"
      >
        بدء المحادثة
      </Button>
    </div>
  );
};

export default PreChatForm;
