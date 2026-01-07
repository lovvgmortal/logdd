import { LucideIcon, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RecentItemProps {
  title: string;
  subtitle: string;
  timestamp: string;
  icon: LucideIcon;
  status?: "draft" | "completed" | "in-progress";
}

export function RecentItem({ title, subtitle, timestamp, icon: Icon, status }: RecentItemProps) {
  const statusColors = {
    draft: "bg-muted text-muted-foreground",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "in-progress": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <div className="group flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-accent/50">
      <div className="rounded-xl bg-primary/10 p-2.5">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{title}</p>
          {status && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusColors[status]}`}>
              {status}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{timestamp}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Open</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
