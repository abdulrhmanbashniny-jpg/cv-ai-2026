import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Phone } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface PreChatFormProps {
  onSubmit: (data: { name: string; phone: string; sessionId: string }) => void;
  title?: string;
}

const PreChatForm = ({ onSubmit, title = "قبل أن نبدأ" }: PreChatFormProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim() || !consent) return;
    const sessionId = uuidv4();
    onSubmit({ name: name.trim(), phone: phone.trim(), sessionId });
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
      <div className="flex items-start gap-2">
        <Checkbox
          id="pdpl-consent"
          checked={consent}
          onCheckedChange={(v) => setConsent(v === true)}
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
      <Button
        onClick={handleSubmit}
        disabled={!name.trim() || !phone.trim() || !consent}
        className="w-full bg-gold-shimmer text-primary-foreground font-arabic glow-gold"
      >
        بدء المحادثة
      </Button>
    </div>
  );
};

export default PreChatForm;
