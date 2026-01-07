import { Sparkles, Clock, Globe } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, GlassCardDescription } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage, Language } from "@/hooks/useLanguage";

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.description')}</p>
      </div>

      {/* Language Selection */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {t('settings.language.title')}
          </GlassCardTitle>
          <GlassCardDescription>
            {t('settings.language.description')}
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
            <SelectTrigger className="w-full max-w-xs rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">🇺🇸 English</SelectItem>
              <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
            </SelectContent>
          </Select>
        </GlassCardContent>
      </GlassCard>

      {/* AI Model Selection - Coming Soon */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('settings.aiModel.title')}
            <Badge variant="secondary" className="ml-2">
              <Clock className="h-3 w-3 mr-1" />
              {t('common.comingSoon')}
            </Badge>
          </GlassCardTitle>
          <GlassCardDescription>
            {t('settings.aiModel.description')}
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-4">
            <p className="font-medium mb-2">✨ {t('settings.aiModel.perStep')}</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>{t('settings.aiModel.dnaLab')}</li>
              <li>{t('settings.aiModel.writerInput')}</li>
              <li>{t('settings.aiModel.writerOutline')}</li>
              <li>{t('settings.aiModel.persona')}</li>
            </ul>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
