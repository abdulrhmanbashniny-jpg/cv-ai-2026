import { Scale, Users, Shield, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ServicesSection = () => {
  const { t } = useLanguage();

  const services = [
    {
      icon: Scale,
      title: t("استشارات نظام العمل", "Labor Law Consultations"),
      description: t(
        "تفسير وتطبيق أنظمة العمل السعودية والأنظمة ذات العلاقة بما يحفظ حقوق جميع الأطراف.",
        "Interpretation and application of Saudi labor laws to protect the rights of all parties."
      ),
    },
    {
      icon: Users,
      title: t("تطوير الموارد البشرية", "HR Development"),
      description: t(
        "بناء هياكل تنظيمية احترافية وتطوير سياسات وإجراءات الموارد البشرية.",
        "Building professional organizational structures and developing HR policies and procedures."
      ),
    },
    {
      icon: Shield,
      title: t("الشؤون القانونية", "Legal Affairs"),
      description: t(
        "مراجعة العقود والاتفاقيات وضمان الامتثال للأنظمة والتشريعات المعمول بها.",
        "Reviewing contracts and agreements, ensuring compliance with applicable laws and regulations."
      ),
    },
    {
      icon: BookOpen,
      title: t("التدريب والتطوير", "Training & Development"),
      description: t(
        "برامج تدريبية متخصصة في إدارة الموارد البشرية ونظام العمل السعودي.",
        "Specialized training programs in HR management and Saudi Labor Law."
      ),
    },
  ];

  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-arabic text-foreground mb-4">
            {t("مجالات", "Areas of")} <span className="text-gradient-gold">{t("التخصص", "Expertise")}</span>
          </h2>
          <p className="text-muted-foreground font-arabic text-lg max-w-2xl mx-auto">
            {t(
              "خدمات استشارية متكاملة تغطي جميع جوانب الموارد البشرية والشؤون القانونية",
              "Comprehensive consulting services covering all aspects of HR and legal affairs"
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="group bg-card border border-border rounded-xl p-8 text-center hover:border-primary/40 hover:glow-gold transition-all duration-300"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <service.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-arabic text-foreground mb-3">{service.title}</h3>
              <p className="text-muted-foreground font-arabic text-sm leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
