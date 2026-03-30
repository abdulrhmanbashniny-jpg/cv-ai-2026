import { Phone, Mail, MapPin } from "lucide-react";
import ContactModal from "@/components/ContactModal";

const Footer = () => {
  return (
    <footer className="bg-navy-deep border-t border-border py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-right">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold font-arabic text-foreground mb-4">
              عبدالرحمن <span className="text-primary">باشنيني</span>
            </h3>
            <p className="text-muted-foreground font-arabic text-sm leading-relaxed">
              مدير أول الموارد البشرية والشؤون القانونية. 
              متخصص في تقديم الاستشارات المهنية وبناء بيئات عمل احترافية.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold font-arabic text-foreground mb-4">روابط سريعة</h4>
            <ul className="space-y-3 font-arabic text-sm">
              <li><a href="/" className="text-muted-foreground hover:text-primary transition-colors">الرئيسية</a></li>
              <li><a href="/careers" className="text-muted-foreground hover:text-primary transition-colors">بوابة التوظيف</a></li>
              <li><a href="/consultation" className="text-muted-foreground hover:text-primary transition-colors">الاستشارات الذكية</a></li>
              <li><a href="/career-gift" className="text-muted-foreground hover:text-primary transition-colors">هدية السيرة الذاتية</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold font-arabic text-foreground mb-4">تواصل معنا</h4>
            <ul className="space-y-3 font-arabic text-sm">
              <li className="flex items-center gap-2 justify-end text-muted-foreground">
                <span>المملكة العربية السعودية</span>
                <MapPin className="h-4 w-4 text-primary" />
              </li>
              <li className="flex items-center gap-2 justify-end text-muted-foreground">
                <span>info@bashniny.com</span>
                <Mail className="h-4 w-4 text-primary" />
              </li>
            </ul>
            <div className="mt-4">
              <ContactModal />
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground font-arabic text-sm">
            © {new Date().getFullYear()} عبدالرحمن باشنيني. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
