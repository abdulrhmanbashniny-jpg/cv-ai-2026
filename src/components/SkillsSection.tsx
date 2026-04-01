import { Briefcase, Scale, Users, Shield, BarChart3, FileCheck, Award, Target } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const SkillsSection = () => {
  const { t } = useLanguage();

  const skills = [
    { icon: Users, label: t("عمليات الموارد البشرية", "HR Operations"), desc: t("إدارة شؤون الموظفين والتوظيف والتدريب", "Employee affairs, recruitment & training") },
    { icon: Scale, label: t("الامتثال القانوني", "Legal Compliance"), desc: t("ضمان التوافق مع نظام العمل السعودي", "Ensuring compliance with Saudi Labor Law") },
    { icon: FileCheck, label: t("تطوير السياسات", "Policy Development"), desc: t("صياغة اللوائح والسياسات التنظيمية", "Drafting organizational regulations & policies") },
    { icon: BarChart3, label: t("إدارة الأداء", "Performance Management"), desc: t("تصميم أنظمة تقييم الأداء الوظيفي", "Designing job performance evaluation systems") },
    { icon: Shield, label: t("العقود والاتفاقيات", "Contracts & Agreements"), desc: t("صياغة ومراجعة العقود بجميع أنواعها", "Drafting and reviewing all types of contracts") },
    { icon: Target, label: t("التخطيط الاستراتيجي", "Strategic Planning"), desc: t("بناء خطط تطوير الأعمال والنمو", "Building business development & growth plans") },
    { icon: Award, label: t("التأمينات الاجتماعية", "Social Insurance"), desc: t("إدارة ملفات التأمينات والمستحقات", "Managing insurance files & entitlements") },
    { icon: Briefcase, label: t("تطوير الأعمال", "Business Development"), desc: t("توسيع السوق وبناء الشراكات", "Market expansion & partnership building") },
  ];

  return (
    <section className="py-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full border border-primary/20" />
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full border border-primary/15" />
      </div>

      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold font-arabic text-foreground mb-4">
            {t("الكفاءات", "Core")} <span className="text-gradient-gold">{t("والمهارات", "Competencies")}</span>
          </h2>
          <p className="text-muted-foreground font-arabic text-lg max-w-2xl mx-auto">
            {t(
              "مهارات متخصصة مبنية على أكثر من 15 عامًا من الخبرة العملية",
              "Specialized skills built on over 15 years of hands-on experience"
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {skills.map((skill, i) => (
            <div
              key={i}
              className="group bg-card/60 border border-border/50 rounded-xl p-5 text-center hover:border-primary/40 hover:bg-card transition-all duration-300"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <skill.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-sm font-bold font-arabic text-foreground mb-1">{skill.label}</h3>
              <p className="text-xs text-muted-foreground font-arabic leading-relaxed">{skill.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
