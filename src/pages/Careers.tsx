import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, Upload, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const cities = ["جدة", "الرياض", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر", "تبوك", "أبها", "حائل", "أخرى"];
const departments = ["الموارد البشرية", "الشؤون القانونية", "المالية", "التسويق", "العمليات", "تقنية المعلومات", "الإدارة", "أخرى"];

const generateRef = () => `ARB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

const validateSaudiPhone = (phone: string) => /^(05|5)\d{8}$/.test(phone.replace(/\s/g, ""));

const Careers = () => {
  // Job seeker state
  const [jsName, setJsName] = useState("");
  const [jsPhone, setJsPhone] = useState("");
  const [jsCity, setJsCity] = useState("");
  const [jsDept, setJsDept] = useState("");
  const [jsFile, setJsFile] = useState<File | null>(null);
  const [jsLoading, setJsLoading] = useState(false);
  const [jsSuccess, setJsSuccess] = useState(false);
  const [jsRef, setJsRef] = useState("");

  // Company state
  const [coName, setCoName] = useState("");
  const [coPerson, setCoPerson] = useState("");
  const [coEmail, setCoEmail] = useState("");
  const [coPhone, setCoPhone] = useState("");
  const [coNeeds, setCoNeeds] = useState("");
  const [coTitles, setCoTitles] = useState("");
  const [coLoading, setCoLoading] = useState(false);
  const [coSuccess, setCoSuccess] = useState(false);
  const [coRef, setCoRef] = useState("");

  const submitJobApp = async () => {
    if (!jsName || !jsPhone || !jsCity || !jsDept) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول", variant: "destructive" });
      return;
    }
    if (!validateSaudiPhone(jsPhone)) {
      toast({ title: "خطأ", description: "رقم الجوال غير صحيح (05XXXXXXXX)", variant: "destructive" });
      return;
    }

    setJsLoading(true);
    const ref = generateRef();
    let cvUrl = null;

    if (jsFile) {
      // Rename: [City]-[Dept]-2024-[Name]-[Ref].pdf
      const ext = jsFile.name.split(".").pop() || "pdf";
      const fileName = `${jsCity}-${jsDept}-${new Date().getFullYear()}-${jsName}-${ref}.${ext}`.replace(/\s/g, "_");
      const { error: uploadError } = await supabase.storage
        .from("cv-uploads")
        .upload(fileName, jsFile);
      if (uploadError) {
        toast({ title: "خطأ في رفع الملف", description: uploadError.message, variant: "destructive" });
        setJsLoading(false);
        return;
      }
      cvUrl = fileName;
    }

    const { error } = await supabase.from("job_applications").insert({
      full_name: jsName,
      phone: jsPhone,
      city: jsCity,
      department: jsDept,
      reference_number: ref,
      cv_url: cvUrl,
    });

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
      setJsLoading(false);
      return;
    }

    // Notify Telegram
    try {
      await supabase.functions.invoke("notify-telegram", {
        body: { type: "job_application", data: { full_name: jsName, phone: jsPhone, city: jsCity, department: jsDept, reference_number: ref } },
      });
    } catch { /* silent */ }

    setJsRef(ref);
    setJsSuccess(true);
    setJsLoading(false);
  };

  const submitCompany = async () => {
    if (!coName || !coPerson || !coEmail || !coPhone || !coNeeds || !coTitles) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول", variant: "destructive" });
      return;
    }

    setCoLoading(true);
    const ref = generateRef();

    const { error } = await supabase.from("company_requests").insert({
      company_name: coName,
      contact_person: coPerson,
      contact_email: coEmail,
      contact_phone: coPhone,
      hiring_needs: coNeeds,
      job_titles: coTitles,
      reference_number: ref,
    });

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
      setCoLoading(false);
      return;
    }

    try {
      await supabase.functions.invoke("notify-telegram", {
        body: { type: "company_request", data: { company_name: coName, contact_person: coPerson, contact_email: coEmail, contact_phone: coPhone, hiring_needs: coNeeds, reference_number: ref } },
      });
    } catch { /* silent */ }

    setCoRef(ref);
    setCoSuccess(true);
    setCoLoading(false);
  };

  return (
    <div dir="rtl" className="min-h-screen">
      <Navbar />
      <section className="pt-24 pb-16 min-h-screen bg-navy-gradient">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold font-arabic text-foreground mb-4">
              بوابة <span className="text-gradient-gold">التوظيف</span>
            </h1>
          </div>

          <Tabs defaultValue="seekers" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="seekers" className="font-arabic"><Users className="h-4 w-4 ml-2" />الباحثون عن عمل</TabsTrigger>
              <TabsTrigger value="companies" className="font-arabic"><Building2 className="h-4 w-4 ml-2" />للشركات</TabsTrigger>
            </TabsList>

            <TabsContent value="seekers">
              {jsSuccess ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold font-arabic text-foreground mb-2">تم إرسال طلبك بنجاح!</h3>
                  <p className="text-muted-foreground font-arabic">رقم المرجع: <span className="text-primary font-bold">{jsRef}</span></p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-6 space-y-4 mt-4">
                  <div>
                    <label className="block font-arabic text-sm text-foreground mb-1">الاسم الكامل *</label>
                    <Input value={jsName} onChange={(e) => setJsName(e.target.value)} className="text-right font-arabic" />
                  </div>
                  <div>
                    <label className="block font-arabic text-sm text-foreground mb-1">رقم الجوال * (05XXXXXXXX)</label>
                    <Input value={jsPhone} onChange={(e) => setJsPhone(e.target.value)} className="text-right font-arabic" dir="ltr" />
                  </div>
                  <div>
                    <label className="block font-arabic text-sm text-foreground mb-1">المدينة *</label>
                    <Select value={jsCity} onValueChange={setJsCity}>
                      <SelectTrigger className="font-arabic"><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                      <SelectContent>{cities.map((c) => <SelectItem key={c} value={c} className="font-arabic">{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block font-arabic text-sm text-foreground mb-1">القسم *</label>
                    <Select value={jsDept} onValueChange={setJsDept}>
                      <SelectTrigger className="font-arabic"><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                      <SelectContent>{departments.map((d) => <SelectItem key={d} value={d} className="font-arabic">{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block font-arabic text-sm text-foreground mb-1">السيرة الذاتية (PDF)</label>
                    <div className="border border-border rounded-lg p-4 text-center">
                      <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setJsFile(e.target.files?.[0] || null)} className="hidden" id="cv-upload" />
                      <label htmlFor="cv-upload" className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <Upload className="h-8 w-8" />
                        <span className="font-arabic text-sm">{jsFile ? jsFile.name : "اضغط لرفع الملف"}</span>
                      </label>
                    </div>
                  </div>
                  <Button onClick={submitJobApp} disabled={jsLoading} className="w-full bg-gold-shimmer text-primary-foreground font-arabic glow-gold">
                    {jsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال الطلب"}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="companies">
              {coSuccess ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold font-arabic text-foreground mb-2">تم إرسال طلبكم بنجاح!</h3>
                  <p className="text-muted-foreground font-arabic">رقم المرجع: <span className="text-primary font-bold">{coRef}</span></p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-6 space-y-4 mt-4">
                  <div>
                    <label className="block font-arabic text-sm text-foreground mb-1">اسم الشركة *</label>
                    <Input value={coName} onChange={(e) => setCoName(e.target.value)} className="text-right font-arabic" />
                  </div>
                  <div>
                    <label className="block font-arabic text-sm text-foreground mb-1">اسم المسؤول *</label>
                    <Input value={coPerson} onChange={(e) => setCoPerson(e.target.value)} className="text-right font-arabic" />
                  </div>
                  <div>
                    <label className="block font-arabic text-sm text-foreground mb-1">البريد الإلكتروني *</label>
                    <Input type="email" value={coEmail} onChange={(e) => setCoEmail(e.target.value)} className="text-right font-arabic" dir="ltr" />
                  </div>
                  <div>
                    <label className="block font-arabic text-sm text-foreground mb-1">رقم الجوال *</label>
                    <Input value={coPhone} onChange={(e) => setCoPhone(e.target.value)} className="text-right font-arabic" dir="ltr" />
                  </div>
                  <div>
                    <label className="block font-arabic text-sm text-foreground mb-1">احتياجات التوظيف *</label>
                    <Textarea value={coNeeds} onChange={(e) => setCoNeeds(e.target.value)} className="text-right font-arabic" rows={3} />
                  </div>
                  <div>
                    <label className="block font-arabic text-sm text-foreground mb-1">المسميات الوظيفية *</label>
                    <Input value={coTitles} onChange={(e) => setCoTitles(e.target.value)} className="text-right font-arabic" placeholder="مثال: محاسب، مهندس، مدير مبيعات" />
                  </div>
                  <Button onClick={submitCompany} disabled={coLoading} className="w-full bg-gold-shimmer text-primary-foreground font-arabic glow-gold">
                    {coLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال الطلب"}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Careers;
