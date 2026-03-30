import { Briefcase, Scale, Users, Shield, BarChart3, FileCheck, Award, Target } from "lucide-react";

const skills = [
  { icon: Users, label: "عمليات الموارد البشرية", desc: "إدارة شؤون الموظفين والتوظيف والتدريب" },
  { icon: Scale, label: "الامتثال القانوني", desc: "ضمان التوافق مع نظام العمل السعودي" },
  { icon: FileCheck, label: "تطوير السياسات", desc: "صياغة اللوائح والسياسات التنظيمية" },
  { icon: BarChart3, label: "إدارة الأداء", desc: "تصميم أنظمة تقييم الأداء الوظيفي" },
  { icon: Shield, label: "العقود والاتفاقيات", desc: "صياغة ومراجعة العقود بجميع أنواعها" },
  { icon: Target, label: "التخطيط الاستراتيجي", desc: "بناء خطط تطوير الأعمال والنمو" },
  { icon: Award, label: "التأمينات الاجتماعية", desc: "إدارة ملفات التأمينات والمستحقات" },
  { icon: Briefcase, label: "تطوير الأعمال", desc: "توسيع السوق وبناء الشراكات" },
];

const SkillsSection = () => {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full border border-primary/20" />
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full border border-primary/15" />
      </div>

      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold font-arabic text-foreground mb-4">
            الكفاءات <span className="text-gradient-gold">والمهارات</span>
          </h2>
          <p className="text-muted-foreground font-arabic text-lg max-w-2xl mx-auto">
            مهارات متخصصة مبنية على أكثر من 15 عامًا من الخبرة العملية
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
