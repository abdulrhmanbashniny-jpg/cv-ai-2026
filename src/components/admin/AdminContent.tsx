import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Image, FileText, Save, Loader2, Eye, Download, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminContentProps {
  settings: Record<string, string>;
  onSave: (data: { setting_key: string; setting_value: string }[]) => Promise<void>;
}

const AdminContent = ({ settings, onSave }: AdminContentProps) => {
  const [heroName, setHeroName] = useState(settings.hero_name || "عبدالرحمن باشنيني");
  const [heroBio, setHeroBio] = useState(settings.hero_bio || "مدير أول الموارد البشرية والشؤون القانونية");
  const [showCvAr, setShowCvAr] = useState(settings.show_cv_ar !== "false");
  const [showCvEn, setShowCvEn] = useState(settings.show_cv_en !== "false");
  const [footerEmail, setFooterEmail] = useState(settings.footer_email || "info@bashniny.com");
  const [footerPhone, setFooterPhone] = useState(settings.footer_phone || "");
  const [cvArUrl, setCvArUrl] = useState(settings.cv_ar_url || "/cv/CV-Ar.docx");
  const [cvEnUrl, setCvEnUrl] = useState(settings.cv_en_url || "/cv/CV-En.docx");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState(settings.hero_image_url || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadHeroImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `hero-profile.${ext}`;
      
      const { error } = await supabase.storage
        .from("cv-uploads")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/cv-uploads/${fileName}`;
      setHeroImageUrl(url);
      toast({ title: "تم", description: "تم رفع الصورة بنجاح" });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const saveContent = async () => {
    setSaving(true);
    await onSave([
      { setting_key: "hero_name", setting_value: heroName },
      { setting_key: "hero_bio", setting_value: heroBio },
      { setting_key: "show_cv_ar", setting_value: String(showCvAr) },
      { setting_key: "show_cv_en", setting_value: String(showCvEn) },
      { setting_key: "footer_email", setting_value: footerEmail },
      { setting_key: "footer_phone", setting_value: footerPhone },
      { setting_key: "hero_image_url", setting_value: heroImageUrl },
      { setting_key: "cv_ar_url", setting_value: cvArUrl },
      { setting_key: "cv_en_url", setting_value: cvEnUrl },
    ]);
    setSaving(false);
    toast({ title: "تم", description: "تم حفظ إعدادات المحتوى" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Hero Settings */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-arabic flex items-center gap-2">
            <Image className="h-4 w-4 text-primary" />
            إعدادات الواجهة الرئيسية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block font-arabic text-xs text-muted-foreground mb-1">الاسم المعروض</label>
            <Input value={heroName} onChange={(e) => setHeroName(e.target.value)} className="text-right font-arabic" />
          </div>
          <div>
            <label className="block font-arabic text-xs text-muted-foreground mb-1">الوصف المهني</label>
            <Textarea value={heroBio} onChange={(e) => setHeroBio(e.target.value)} className="text-right font-arabic" rows={3} />
          </div>
          {/* Hero Image Upload */}
          <div>
            <label className="block font-arabic text-xs text-muted-foreground mb-1">الصورة الشخصية</label>
            <div className="flex items-center gap-3">
              {heroImageUrl && (
                <img src={heroImageUrl} alt="Hero" className="w-16 h-16 rounded-full object-cover border-2 border-primary/30" />
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadHeroImage(file);
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="font-arabic text-xs gap-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  رفع صورة جديدة
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CV Manager */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-arabic flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-400" />
            إدارة السيرة الذاتية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Arabic CV */}
          <div className="bg-secondary/20 rounded-lg p-3 border border-border/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Switch checked={showCvAr} onCheckedChange={setShowCvAr} id="cv-ar" />
                <Label htmlFor="cv-ar" className="font-arabic text-xs cursor-pointer">
                  {showCvAr ? "ظاهر" : "مخفي"}
                </Label>
              </div>
              <span className="font-arabic text-sm font-medium text-foreground">السيرة الذاتية - عربي</span>
            </div>
            <div className="mb-2">
              <label className="block font-arabic text-xs text-muted-foreground mb-1">رابط الملف (URL أو مسار)</label>
              <Input value={cvArUrl} onChange={(e) => setCvArUrl(e.target.value)} className="font-mono text-sm" dir="ltr" placeholder="/cv/CV-Ar.docx" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs font-arabic gap-1" onClick={() => window.open(cvArUrl)}>
                <Eye className="h-3 w-3" />معاينة
              </Button>
              <Button size="sm" variant="outline" className="text-xs font-arabic gap-1" asChild>
                <a href={cvArUrl} download><Download className="h-3 w-3" />تحميل</a>
              </Button>
            </div>
          </div>

          {/* English CV */}
          <div className="bg-secondary/20 rounded-lg p-3 border border-border/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Switch checked={showCvEn} onCheckedChange={setShowCvEn} id="cv-en" />
                <Label htmlFor="cv-en" className="font-arabic text-xs cursor-pointer">
                  {showCvEn ? "ظاهر" : "مخفي"}
                </Label>
              </div>
              <span className="font-arabic text-sm font-medium text-foreground">السيرة الذاتية - English</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs font-arabic gap-1" onClick={() => window.open("/cv/CV-En.docx")}>
                <Eye className="h-3 w-3" />معاينة
              </Button>
              <Button size="sm" variant="outline" className="text-xs font-arabic gap-1" asChild>
                <a href="/cv/CV-En.docx" download><Download className="h-3 w-3" />تحميل</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Settings */}
      <Card className="border-border/50 lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-arabic flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-400" />
            إعدادات التذييل (Footer)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-arabic text-xs text-muted-foreground mb-1">البريد الإلكتروني</label>
              <Input value={footerEmail} onChange={(e) => setFooterEmail(e.target.value)} className="font-mono text-sm" dir="ltr" placeholder="info@bashniny.com" />
            </div>
            <div>
              <label className="block font-arabic text-xs text-muted-foreground mb-1">رقم الهاتف</label>
              <Input value={footerPhone} onChange={(e) => setFooterPhone(e.target.value)} className="font-mono text-sm" dir="ltr" placeholder="+966..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="lg:col-span-2">
        <Button onClick={saveContent} disabled={saving} className="bg-gold-shimmer text-primary-foreground font-arabic glow-gold gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ إعدادات المحتوى
        </Button>
      </div>
    </div>
  );
};

export default AdminContent;
