import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CareerTimeline from "@/components/CareerTimeline";
import ServicesSection from "@/components/ServicesSection";
import SkillsSection from "@/components/SkillsSection";
import AITwinCTA from "@/components/AITwinCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div dir="rtl" className="min-h-screen">
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
