import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import type { SurveyScores } from "@/hooks/useChatSession";

interface QualitySurveyProps {
  onSubmit: (scores: SurveyScores) => void;
  onSkip: () => void;
  loading?: boolean;
  lang?: string;
}

const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
  <div className="space-y-1">
    <p className="text-sm font-arabic text-foreground">{label}</p>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`h-6 w-6 ${s <= value ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
          />
        </button>
      ))}
    </div>
  </div>
);

const QualitySurvey = ({ onSubmit, onSkip, loading, lang = "ar" }: QualitySurveyProps) => {
  const [ease, setEase] = useState(0);
  const [quality, setQuality] = useState(0);
  const [needs, setNeeds] = useState("");
  const t = (ar: string, en: string) => lang === "ar" ? ar : en;

  return (
    <div className="space-y-4 p-4">
      <h3 className="font-arabic font-bold text-foreground text-center text-base">
        {t("قبل الإنهاء — رأيك يهمنا! 🌟", "Before ending — your feedback matters! 🌟")}
      </h3>

      <StarRating
        value={ease}
        onChange={setEase}
        label={t("1. ما مدى سهولة استخدام الخدمة؟", "1. How easy was it to use the service?")}
      />

      <StarRating
        value={quality}
        onChange={setQuality}
        label={t("2. كيف تقيّم جودة المخرجات؟", "2. How would you rate the output quality?")}
      />

      <div className="space-y-1">
        <p className="text-sm font-arabic text-foreground">
          {t("3. ما هي احتياجاتك المستقبلية؟", "3. What are your future needs?")}
        </p>
        <Textarea
          value={needs}
          onChange={(e) => setNeeds(e.target.value)}
          placeholder={t("مثال: أحتاج تدقيق لوائح داخلية، هيكلة موارد بشرية...", "e.g. Internal policy audit, HR restructuring...")}
          className="font-arabic text-sm"
          rows={2}
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => onSubmit({ ease, quality, needs })}
          disabled={ease === 0 || quality === 0 || loading}
          className="flex-1 bg-gold-shimmer text-primary-foreground font-arabic glow-gold"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("إرسال التقييم وإنهاء", "Submit & End")}
        </Button>
        <Button
          onClick={onSkip}
          disabled={loading}
          variant="ghost"
          className="font-arabic text-xs text-muted-foreground"
        >
          {t("تخطي", "Skip")}
        </Button>
      </div>
    </div>
  );
};

export default QualitySurvey;
