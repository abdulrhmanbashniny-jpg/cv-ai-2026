import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Crown, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ThankYouModalProps {
  open: boolean;
  onClose: () => void;
  templateTitle: string;
  downloadUrl?: string;
}

const ThankYouModal = ({ open, onClose, templateTitle, downloadUrl }: ThankYouModalProps) => {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md text-center" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-arabic flex items-center justify-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            {t("تم بنجاح!", "Success!")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground font-arabic">
            {t(`تم تحميل "${templateTitle}" بنجاح.`, `"${templateTitle}" downloaded successfully.`)}
          </p>

          {downloadUrl && (
            <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white font-arabic gap-2">
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                {t("فتح الملف", "Open File")}
              </a>
            </Button>
          )}

          {/* Premium Upsell */}
          <div className="border border-primary/30 rounded-xl p-4 bg-primary/5 mt-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-primary" />
              <h3 className="font-arabic font-bold text-sm text-primary">
                {t("باقة النماذج المميزة", "Premium Templates Bundle")}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground font-arabic mb-3">
              {t(
                "احصل على جميع النماذج الإدارية والقانونية المميزة بسعر مخفض. تواصل مع الأستاذ عبدالرحمن مباشرة!",
                "Get all premium administrative & legal templates at a discount. Contact Abdulrahman directly!"
              )}
            </p>
            <Button asChild variant="outline" className="w-full border-primary text-primary font-arabic gap-2">
              <a
                href={`https://wa.me/9665xxxxxxxx?text=${encodeURIComponent("أهلاً أستاذ عبدالرحمن، أرغب في الاستفسار عن باقة النماذج المميزة")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Crown className="h-4 w-4" />
                {t("استفسار عن الباقة", "Inquire About Bundle")}
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThankYouModal;
