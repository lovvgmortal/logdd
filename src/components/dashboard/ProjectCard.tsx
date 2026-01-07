import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { format } from "date-fns";
import { Lightbulb, RefreshCw } from "lucide-react";

interface ProjectCardProps {
  title: string;
  subtitle?: string;
  status?: string;
  mode?: "new-idea" | "rewrite" | string;
  date: string;
  language?: string;
  onClick?: () => void;
}

export function ProjectCard({ title, subtitle, status = "draft", mode, date, language = "English", onClick }: ProjectCardProps) {
  const isDone = status === "done";
  
  return (
    <GlassCard 
      variant="elevated" 
      className="cursor-pointer transition-all hover:border-primary/50 h-[140px]"
      onClick={onClick}
    >
      <GlassCardContent className="p-4 h-full flex flex-col">
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`text-xs uppercase ${
              isDone 
                ? "bg-green-500/10 text-green-600 border-green-500/30" 
                : "bg-muted text-muted-foreground"
            }`}
          >
            {status}
          </Badge>
          {mode && (
            <Badge variant="secondary" className="text-xs gap-1">
              {mode === "new-idea" ? (
                <>
                  <Lightbulb className="h-3 w-3" />
                  Idea
                </>
              ) : mode === "rewrite" ? (
                <>
                  <RefreshCw className="h-3 w-3" />
                  Rewrite
                </>
              ) : null}
            </Badge>
          )}
        </div>
        
        <div className="flex-1 mt-2 space-y-1 min-h-0">
          <h3 className="font-semibold line-clamp-1">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground line-clamp-2">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span>{format(new Date(date), "dd/MM/yyyy")}</span>
          <span className="uppercase">{language}</span>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
