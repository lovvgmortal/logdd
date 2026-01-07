import {
  Dna,
  Users,
  PenTool,
  LayoutDashboard,
  Search
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLanguage } from "@/hooks/useLanguage";

const navItems = [
  { titleKey: "nav.home", url: "/", icon: LayoutDashboard },
  { titleKey: "nav.dna", url: "/dna-lab", icon: Dna },
  { titleKey: "nav.personas", url: "/personas", icon: Users },
  { titleKey: "nav.writer", url: "/writer", icon: PenTool },
  { titleKey: "nav.tubeClone", url: "/tubeclone", icon: Search },
];

export function MobileNav() {
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/80 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map((item) => (
          <NavLink
            key={item.titleKey}
            to={item.url}
            end={item.url === "/"}
            className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{t(item.titleKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
