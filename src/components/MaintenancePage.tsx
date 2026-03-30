import { AlertTriangle } from "lucide-react";

const MaintenancePage = () => {
  return (
    <div dir="rtl" className="min-h-screen bg-navy-gradient flex items-center justify-center">
      <div className="text-center max-w-lg px-6">
        <AlertTriangle className="h-20 w-20 text-primary mx-auto mb-6 animate-pulse" />
        <h1 className="text-4xl font-bold font-arabic text-foreground mb-4">
          قريباً
        </h1>
        <p className="text-xl text-muted-foreground font-arabic mb-2">
          الموقع تحت التحديث والتطوير
        </p>
        <p className="text-sm text-muted-foreground font-arabic">
          نعمل على تحسين تجربتكم. سنعود قريباً بإذن الله.
        </p>
        <div className="mt-8 w-48 h-1 bg-primary/30 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
