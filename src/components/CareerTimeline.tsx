import { Building2, Calendar, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TimelineRole {
  title: string;
  period: string;
  description: string;
}

interface TimelineItem {
  company: string;
  roles: TimelineRole[];
}

const CareerTimeline = () => {
  const { t, lang } = useLanguage();

  const timelineData: TimelineItem[] = [
    {
      company: t("فندق راديسون بلو - الأجنحة الملكية", "Radisson Blu Hotel - Royal Suite"),
      roles: [
        {
          title: t("مساعد مدير الموارد البشرية", "Assistant HR Manager"),
          period: t("2010 - 2013", "2010 - 2013"),
          description: t(
            "دعم عمليات التوظيف وملفات الموظفين وإجراءات الانضباط والتقارير.",
            "Supported recruitment operations, employee files, disciplinary procedures, and reporting."
          ),
        },
      ],
    },
    {
      company: t("شركة الأغذية العربية للتموين", "Arab Food Catering Company"),
      roles: [
        {
          title: t("مسؤول الموارد البشرية", "HR Officer"),
          period: t("2013 - 2016", "2013 - 2016"),
          description: t(
            "إدارة شؤون الموظفين والتوظيف والمشاركة في معارض التوظيف.",
            "Managed employee affairs, recruitment, and participated in career fairs."
          ),
        },
      ],
    },
    {
      company: t("نجوم الحفل للمعارض والمؤتمرات", "Nojoom Al-Hafl Exhibitions & Conferences"),
      roles: [
        {
          title: t("مدير مشاريع", "Project Manager"),
          period: t("2016 - 2018", "2016 - 2018"),
          description: t(
            "إدارة مشاريع المعارض والفعاليات من البداية للنهاية مع ضبط الميزانيات والجداول.",
            "Managed exhibition and event projects end-to-end with budget and schedule control."
          ),
        },
      ],
    },
    {
      company: t("مصنع دهانات وبلاستك جدة", "Jeddah Paints & Putty Factory Co."),
      roles: [
        {
          title: t("مدير الموارد البشرية والشؤون القانونية", "HR & Legal Affairs Manager"),
          period: t("مايو 2018 - ديسمبر 2025", "May 2018 – Dec 2025"),
          description: t(
            "قيادة الموارد البشرية والشؤون القانونية وضمان الامتثال التنظيمي وصياغة العقود.",
            "Led HR and legal affairs, ensured regulatory compliance, and drafted contracts."
          ),
        },
        {
          title: t("مدير تطوير الأعمال", "Business Development Manager"),
          period: t("يناير 2026 - الحاضر", "Jan 2026 – Present"),
          description: t(
            "قيادة مبادرات تطوير الأعمال وتوسيع السوق وبناء الشراكات الاستراتيجية.",
            "Leading business development initiatives, market expansion, and strategic partnerships."
          ),
        },
      ],
    },
  ];

  return (
    <section className="py-24 bg-navy-deep relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-arabic text-foreground mb-4">
            {t("المسيرة", "Career")} <span className="text-gradient-gold">{t("المهنية", "Journey")}</span>
          </h2>
          <p className="text-muted-foreground font-arabic text-lg max-w-2xl mx-auto">
            {t(
              "أكثر من 15 عامًا من الخبرة في مجالات الموارد البشرية والشؤون القانونية وتطوير الأعمال",
              "Over 15 years of experience in HR, Legal Affairs, and Business Development"
            )}
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical line */}
          <div className="absolute top-0 bottom-0 right-1/2 w-px bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0" />

          {timelineData.map((item, index) => (
            <div
              key={index}
              className={`relative flex items-start mb-16 last:mb-0 ${
                index % 2 === 0 ? "flex-row-reverse" : ""
              }`}
            >
              {/* Dot */}
              <div className="absolute right-1/2 transform translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-navy-deep z-10 top-6" />

              {/* Card */}
              <div className={`w-5/12 ${index % 2 === 0 ? "pr-12" : "pl-12 mr-auto"}`} style={{ textAlign: lang === "ar" ? "right" : "left" }}>
                <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-colors group">
                  <div className={`flex items-center gap-2 mb-3 ${lang === "ar" ? "justify-end" : "justify-start"}`}>
                    <Building2 className="h-5 w-5 text-primary/60" />
                    <h3 className="text-lg font-bold font-arabic text-foreground">{item.company}</h3>
                  </div>

                  {item.roles.map((role, ri) => (
                    <div key={ri} className={`${ri > 0 ? "mt-4 pt-4 border-t border-border/50" : ""}`}>
                      {ri > 0 && (
                        <div className={`flex items-center gap-1 mb-1 ${lang === "ar" ? "justify-end" : "justify-start"}`}>
                          <ChevronUp className="h-3.5 w-3.5 text-primary" />
                          <span className="text-primary font-arabic text-xs font-medium">{t("ترقية", "Promoted")}</span>
                        </div>
                      )}
                      <div className={`flex items-center gap-2 mb-1 ${lang === "ar" ? "justify-end" : "justify-start"}`}>
                        <span className="text-primary font-arabic text-sm font-semibold flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {role.period}
                        </span>
                      </div>
                      <p className="text-primary font-arabic text-sm mb-1 font-medium">{role.title}</p>
                      <p className="text-muted-foreground font-arabic text-sm leading-relaxed">{role.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CareerTimeline;
