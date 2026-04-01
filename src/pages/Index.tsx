import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CareerTimeline from "@/components/CareerTimeline";
import ServicesSection from "@/components/ServicesSection";
import SkillsSection from "@/components/SkillsSection";
import AITwinCTA from "@/components/AITwinCTA";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { dir } = useLanguage();

  return (
    <div dir={dir} className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <SkillsSection />
      <AITwinCTA />
      <CareerTimeline />
      <Footer />
    </div>
  );
};

export default Index;
