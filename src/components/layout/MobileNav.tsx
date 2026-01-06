import {
  Dna,
  Users,
  PenTool,
  LayoutDashboard,
  Search
} from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "DNA", url: "/dna-lab", icon: Dna },
  { title: "Personas", url: "/personas", icon: Users },
  { title: "Writer", url: "/writer", icon: PenTool },
  { title: "TubeClone", url: "/tubeclone", icon: Search },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/80 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/"}
            className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
