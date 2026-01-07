import { Dna, Users, PenTool, StickyNote, LayoutDashboard, Settings, Cloud, LogOut, PanelLeftClose, PanelLeft, Search } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";

const mainNavItems = [
  { titleKey: "nav.dashboard", url: "/", icon: LayoutDashboard },
  { titleKey: "nav.dnaLab", url: "/dna-lab", icon: Dna },
  { titleKey: "nav.personas", url: "/personas", icon: Users },
  { titleKey: "nav.writer", url: "/writer", icon: PenTool },
  { titleKey: "nav.tubeClone", url: "/tubeclone", icon: Search },
  { titleKey: "nav.notes", url: "/notes", icon: StickyNote },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Cloud className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight">LOG</span>
              <span className="text-xs text-muted-foreground">Content Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
            {t('nav.workspace')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map(item => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild tooltip={t(item.titleKey)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent"
                      activeClassName="bg-primary/10 text-primary"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{t(item.titleKey)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-2">
        <SidebarMenu>
          {/* Toggle Sidebar Button */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={isCollapsed ? "Expand Sidebar" : t('nav.collapse')}>
              <Button
                variant="ghost"
                onClick={toggleSidebar}
                className="w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent"
              >
                {isCollapsed ? (
                  <PanelLeft className="h-5 w-5 shrink-0" />
                ) : (
                  <PanelLeftClose className="h-5 w-5 shrink-0" />
                )}
                {!isCollapsed && <span>{t('nav.collapse')}</span>}
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Settings */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t('nav.settings')}>
              <NavLink
                to="/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent"
                activeClassName="bg-primary/10 text-primary"
              >
                <Settings className="h-5 w-5 shrink-0" />
                <span>{t('nav.settings')}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Logout */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t('nav.logout')}>
              <Button
                variant="ghost"
                onClick={signOut}
                className="w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{t('nav.logout')}</span>}
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
