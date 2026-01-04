import { Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  compact?: boolean;
}

const MODELS = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", description: "Next-Gen Fast" },
  { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro", description: "Next-Gen Quality" },
  { value: "anthropic/claude-sonnet-4.5", label: "Claude 4.5 Sonnet", description: "Adv. Reasoning" },
  { value: "openai/gpt-5.2", label: "GPT-5.2", description: "State of the Art" },
  { value: "openai/gpt-oss-120b:free", label: "GPT-OSS 120B", description: "Open Source" },
];

export function ModelSelector({ value, onChange, label, compact = false }: ModelSelectorProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {label && (
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {label}:
          </Label>
        )}
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-8 rounded-lg text-xs w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value} className="text-xs">
                {model.label} ({model.description})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {label}
        </Label>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MODELS.map((model) => (
            <SelectItem key={model.value} value={model.value}>
              {model.label} ({model.description})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
