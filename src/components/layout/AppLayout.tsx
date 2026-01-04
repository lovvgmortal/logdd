import { ReactNode, useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <SidebarInset className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl md:h-16 md:px-6">
            <SidebarTrigger className="hidden md:flex" />
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground hidden sm:block">
                {displayName}
              </span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 overflow-auto pb-20 md:pb-0">
            {children}
          </main>
        </SidebarInset>
        <MobileNav />
      </div>
    </SidebarProvider>
  );
}
