import { Search, Dna, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DNACard } from "./DNACard";
import { useLanguage } from "@/hooks/useLanguage";
import type { DNA } from "../types";

interface DNAListProps {
    dnas: DNA[];
    loading: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onView: (dna: DNA) => void;
    onExport: (dna: DNA) => void;
    onDelete: (id: string) => void;
}

export function DNAList({
    dnas,
    loading,
    searchQuery,
    onSearchChange,
    onView,
    onExport,
    onDelete,
}: DNAListProps) {
    const { t } = useLanguage();
    const filteredDnas = dnas.filter(dna =>
        dna.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dna.niche?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder={t('dnaLab.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 rounded-xl bg-card/50"
                />
            </div>

            {/* DNA Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : filteredDnas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Dna className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('dnaLab.noDna')}</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {filteredDnas.map((dna) => (
                        <DNACard
                            key={dna.id}
                            dna={dna}
                            onView={onView}
                            onExport={onExport}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
