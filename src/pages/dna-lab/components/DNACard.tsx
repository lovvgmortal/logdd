import { Dna, ChevronRight, Download, Trash2 } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, GlassCardDescription } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import type { DNA } from "../types";

interface DNACardProps {
    dna: DNA;
    onView: (dna: DNA) => void;
    onExport: (dna: DNA) => void;
    onDelete: (id: string) => void;
}

export function DNACard({ dna, onView, onExport, onDelete }: DNACardProps) {
    return (
        <GlassCard
            variant="elevated"
            className="group cursor-pointer"
            onClick={() => onView(dna)}
        >
            <GlassCardHeader>
                <div className="flex items-start justify-between">
                    <div className="rounded-xl bg-primary/10 p-2.5">
                        <Dna className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation();
                                onExport(dna);
                            }}
                        >
                            <Download className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(dna.id);
                            }}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                    </div>
                </div>
                <GlassCardTitle className="mt-3">{dna.name}</GlassCardTitle>
                <GlassCardDescription>
                    {dna.niche || "No niche"} • {dna.source_url ? "1 source" : "Manual"}
                </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="pt-0">
            </GlassCardContent>
        </GlassCard>
    );
}
