import { LayoutDashboard, Inbox, Brain, Puzzle, FileText, LogOut, MessageCircle, Bot, Cog, TrendingUp, FileUser, Package, Users, Megaphone } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const items = [
  { title: "لوحة التحكم", value: "dashboard", icon: LayoutDashboard },
  { title: "البريد الوارد", value: "inbox", icon: Inbox },
  { title: "سجل المحادثات", value: "chatHistory", icon: MessageCircle },
  { title: "إدارة الذكاء", value: "ai", icon: Brain },
  { title: "إعدادات الوكلاء", value: "agentPrompts", icon: Bot },
  { title: "المحلل الذكي (CAIO)", value: "caio", icon: TrendingUp },
  { title: "مدير السيرة الذاتية", value: "resume", icon: FileUser },
  { title: "إدارة المحتوى", value: "content", icon: FileText },
  { title: "التكاملات", value: "integrations", icon: Puzzle },
  { title: "الإعدادات", value: "settings", icon: Cog },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const AdminSidebar = ({ activeTab, onTabChange, onLogout }: AdminSidebarProps) => {
  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-arabic text-primary font-bold text-base px-4 py-3">
            باشنيني
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.value)}
                    isActive={activeTab === item.value}
                    className="font-arabic gap-3"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button variant="ghost" size="sm" onClick={onLogout} className="w-full font-arabic text-muted-foreground justify-start gap-2">
          <LogOut className="h-4 w-4" />
          <span>خروج</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
