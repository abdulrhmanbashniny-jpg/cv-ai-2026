import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Careers from "./pages/Careers.tsx";
import Consultation from "./pages/Consultation.tsx";
import CareerGift from "./pages/CareerGift.tsx";
import Admin from "./pages/Admin.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import Templates from "./pages/Templates.tsx";
import MaintenancePage from "./components/MaintenancePage.tsx";
import FloatingAIChat from "./components/FloatingAIChat.tsx";
import PromoBar from "./components/PromoBar.tsx";
import WelcomePopup from "./components/WelcomePopup.tsx";

const queryClient = new QueryClient();

const MaintenanceWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [maintenance, setMaintenance] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (location.pathname === "/admin") {
      setChecked(true);
      return;
    }
    
    const check = async () => {
      try {
        const { data } = await supabase.functions.invoke("admin-data", {
          body: { table: "admin_settings" },
        });
        const settings = data?.data || [];
        const m = settings.find((s: any) => s.setting_key === "maintenance_mode");
        setMaintenance(m?.setting_value === "true");
      } catch {
        // If check fails, show site normally
      }
      setChecked(true);
    };
    check();
  }, [location.pathname]);

  // GA4 page view tracking on route change
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("config", "G-5JWJ48GGD4", {
        page_path: location.pathname,
      });
    }
  }, [location.pathname]);

  if (!checked) return null;
  if (maintenance && location.pathname !== "/admin") return <MaintenancePage />;
  return <>
    {children}
    {!location.pathname.startsWith("/admin") && <FloatingAIChat />}
  </>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MaintenanceWrapper>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/consultation" element={<Consultation />} />
              <Route path="/career-gift" element={<CareerGift />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MaintenanceWrapper>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
