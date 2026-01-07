import { ReactNode, useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, SubscriptionTier } from "@/hooks/useSubscription";
import { Sparkles, Zap, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface AppLayoutProps {
  children: ReactNode;
}

// Tier display config
const TIER_CONFIG: Record<SubscriptionTier, { icon: React.ElementType; label: string; className: string }> = {
  starter: { icon: Sparkles, label: "Starter", className: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  pro: { icon: Zap, label: "Pro", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  ultra: { icon: Crown, label: "Ultra", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
};

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const { tier, loading: tierLoading } = useSubscription();
  const navigate = useNavigate();
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
  const tierConfig = TIER_CONFIG[tier];
  const TierIcon = tierConfig.icon;

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
              {/* Tier Badge */}
              {!tierLoading && (
                <Badge
                  variant="outline"
                  className={`cursor-pointer gap-1 ${tierConfig.className}`}
                  onClick={() => navigate("/pricing")}
                >
                  <TierIcon className="h-3 w-3" />
                  <span className="hidden sm:inline">{tierConfig.label}</span>
                </Badge>
              )}
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

