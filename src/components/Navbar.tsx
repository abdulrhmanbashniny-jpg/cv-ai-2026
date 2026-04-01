import { useState } from "react";
import { Menu, X, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const navLinks = [
    { label: t("الرئيسية", "Home"), href: "/" },
    { label: t("خدمات الشركات", "Corporate Services"), href: "/careers" },
    { label: t("المستشار العمالي", "Legal Advisor"), href: "/consultation" },
    { label: t("بناء سيرة ذاتية", "CV Builder"), href: "/career-gift" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-deep/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="font-arabic font-bold text-lg text-foreground">
            {t("عبدالرحمن", "Abdulrahman")} <span className="text-primary">{t("باشنيني", "Bashniny")}</span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-arabic text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors border border-border/50 rounded-full px-3 py-1.5"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="font-medium">{lang === "ar" ? "EN" : "AR"}</span>
            </button>
          </div>

          {/* Mobile Toggle */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="flex items-center gap-1 text-xs text-muted-foreground border border-border/50 rounded-full px-2.5 py-1"
            >
              <Globe className="h-3 w-3" />
              {lang === "ar" ? "EN" : "AR"}
            </button>
            <button
              className="text-foreground"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block py-3 font-arabic text-muted-foreground hover:text-primary transition-colors"
                style={{ textAlign: lang === "ar" ? "right" : "left" }}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
