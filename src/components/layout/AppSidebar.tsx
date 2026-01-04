import { Dna, Users, PenTool, StickyNote, LayoutDashboard, Settings, Cloud, LogOut, PanelLeftClose, PanelLeft } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const mainNavItems = [{
  title: "Dashboard",
  url: "/",
  icon: LayoutDashboard
}, {
  title: "DNA Lab",
  url: "/dna-lab",
  icon: Dna
}, {
  title: "Personas",
  url: "/personas",
  icon: Users
}, {
  title: "Writer",
  url: "/writer",
  icon: PenTool
}, {
  title: "Notes",
  url: "/notes",
  icon: StickyNote
}];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const { signOut } = useAuth();
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
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"} 
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent" 
                      activeClassName="bg-primary/10 text-primary"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{item.title}</span>
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
            <SidebarMenuButton asChild tooltip={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
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
                {!isCollapsed && <span>Collapse</span>}
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Settings */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <NavLink 
                to="/settings" 
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent" 
                activeClassName="bg-primary/10 text-primary"
              >
                <Settings className="h-5 w-5 shrink-0" />
                <span>Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Logout */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Logout">
              <Button
                variant="ghost"
                onClick={signOut}
                className="w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>Logout</span>}
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
