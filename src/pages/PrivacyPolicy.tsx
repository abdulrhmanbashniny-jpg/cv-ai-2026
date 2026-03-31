import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div dir="rtl" className="min-h-screen">
      <Navbar />
      <section className="pt-24 pb-16 min-h-screen bg-navy-gradient">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold font-arabic text-foreground mb-8 text-center">
            سياسة <span className="text-gradient-gold">الخصوصية</span>
          </h1>

          <div className="bg-card border border-border rounded-xl p-8 space-y-6 font-arabic text-sm text-muted-foreground leading-relaxed">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">مقدمة</h2>
              <p>
                نلتزم في منصة عبدالرحمن باشنيني بحماية خصوصية بياناتك الشخصية وفقاً لأحكام نظام حماية البيانات الشخصية (PDPL) الصادر بالمرسوم الملكي رقم م/19 بتاريخ 1443/2/9هـ في المملكة العربية السعودية.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">البيانات التي نجمعها</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>الاسم الكامل ورقم الجوال (عند استخدام خدمة المحادثة أو التقديم على الوظائف)</li>
                <li>البريد الإلكتروني (اختياري، عند التواصل معنا)</li>
                <li>محتوى المحادثات مع المساعد الذكي</li>
                <li>السيرة الذاتية والملفات المرفقة (عند التقديم على الوظائف)</li>
                <li>بيانات التصفح ومعلومات الجهاز (عبر أدوات التحليل)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">أغراض جمع البيانات</h2>
              <p>تُستخدم بياناتك حصرياً للأغراض التالية:</p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>تقديم خدمات التوظيف والاستشارات المهنية</li>
                <li>تحسين تجربة المستخدم وأداء المنصة</li>
                <li>التواصل معك بخصوص طلباتك واستشاراتك</li>
                <li>تحليل بيانات الاستخدام لتطوير الخدمات</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">مشاركة البيانات</h2>
              <p>
                لا نشارك بياناتك الشخصية مع أي أطراف ثالثة لأغراض تسويقية أو تجارية. قد تتم مشاركة البيانات فقط في الحالات التالية:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>بموافقتك الصريحة</li>
                <li>لتنفيذ التزام قانوني أو أمر قضائي</li>
                <li>مع مزودي الخدمات التقنية الضروريين لتشغيل المنصة (مع ضمان حماية البيانات)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">حماية البيانات</h2>
              <p>
                نتخذ التدابير التقنية والتنظيمية اللازمة لحماية بياناتك من الوصول غير المصرح به أو الفقدان أو التلف، بما في ذلك التشفير وأنظمة التحكم بالوصول.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">حقوقك</h2>
              <p>يحق لك وفقاً لنظام حماية البيانات الشخصية:</p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>الاطلاع على بياناتك الشخصية المحفوظة لدينا</li>
                <li>طلب تصحيح أو تحديث بياناتك</li>
                <li>طلب حذف بياناتك</li>
                <li>سحب موافقتك على معالجة البيانات</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">الاحتفاظ بالبيانات</h2>
              <p>
                نحتفظ ببياناتك الشخصية طالما كانت ضرورية للأغراض المذكورة أعلاه، أو وفقاً للمتطلبات القانونية المعمول بها.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">التواصل</h2>
              <p>
                لأي استفسارات حول سياسة الخصوصية أو لممارسة حقوقك، يمكنك التواصل معنا عبر نموذج "تواصل معنا" في أسفل الصفحة.
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                آخر تحديث: {new Date().toLocaleDateString("ar-SA")}
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
