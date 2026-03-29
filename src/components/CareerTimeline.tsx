import { Building2, Calendar } from "lucide-react";

interface TimelineItem {
  year: string;
  company: string;
  role: string;
  description: string;
}

const timelineData: TimelineItem[] = [
  {
    year: "2008 - 2012",
    company: "دهانات جدة",
    role: "مسؤول شؤون الموظفين",
    description: "بداية المسيرة المهنية في إدارة شؤون الموظفين والتعاقدات وإجراءات العمل.",
  },
  {
    year: "2012 - 2015",
    company: "فندق راديسون بلو",
    role: "مشرف الموارد البشرية",
    description: "تطوير سياسات الموارد البشرية في قطاع الضيافة والإشراف على التوظيف والتدريب.",
  },
  {
    year: "2015 - 2019",
    company: "مجموعة شركات كبرى",
    role: "مدير الموارد البشرية",
    description: "قيادة فرق الموارد البشرية وتطوير الهياكل التنظيمية والأنظمة الداخلية.",
  },
  {
    year: "2019 - الحاضر",
    company: "استشاري مستقل",
    role: "مدير أول الموارد البشرية والشؤون القانونية",
    description: "تقديم استشارات متخصصة في نظام العمل السعودي وبناء بيئات عمل احترافية.",
  },
];

const CareerTimeline = () => {
  return (
    <section className="py-24 bg-navy-deep relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-arabic text-foreground mb-4">
            المسيرة <span className="text-gradient-gold">المهنية</span>
          </h2>
          <p className="text-muted-foreground font-arabic text-lg max-w-2xl mx-auto">
            أكثر من 15 عامًا من الخبرة في مجالات الموارد البشرية والشؤون القانونية
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical line */}
          <div className="absolute top-0 bottom-0 right-1/2 w-px bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0" />

          {timelineData.map((item, index) => (
            <div
              key={index}
              className={`relative flex items-center mb-16 last:mb-0 ${
                index % 2 === 0 ? "flex-row-reverse" : ""
              }`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Dot */}
              <div className="absolute right-1/2 transform translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-navy-deep z-10" />

              {/* Card */}
              <div className={`w-5/12 ${index % 2 === 0 ? "text-right pr-12" : "text-right pl-12 mr-auto"}`}>
                <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-colors group">
                  <div className="flex items-center gap-2 mb-3 justify-end">
                    <span className="text-primary font-arabic text-sm font-semibold flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {item.year}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2 justify-end">
                    <h3 className="text-lg font-bold font-arabic text-foreground">{item.company}</h3>
                    <Building2 className="h-5 w-5 text-primary/60" />
                  </div>
                  <p className="text-primary font-arabic text-sm mb-2">{item.role}</p>
                  <p className="text-muted-foreground font-arabic text-sm leading-relaxed">
                    {item.description}
                  </p>
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
