import { useMemo } from "react";
import { useLanguage } from "@/hooks/useLanguage";

interface WordCountProps {
  text: string;
  className?: string;
  showCharacters?: boolean;
}

export function WordCount({ text, className = "", showCharacters = false }: WordCountProps) {
  const { t } = useLanguage();
  const stats = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return { words: 0, characters: 0 };

    const words = trimmed.split(/\s+/).filter(Boolean).length;
    const characters = trimmed.length;

    return { words, characters };
  }, [text]);

  return (
    <span className={`text-xs text-muted-foreground ${className}`}>
      {stats.words} {t('common.words')}
      {showCharacters && ` • ${stats.characters} ${t('common.chars')}`}
    </span>
  );
}

interface TextareaWithCountProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  showCharacters?: boolean;
}

export function TextareaWithCount({
  value,
  onValueChange,
  label,
  showCharacters = false,
  className = "",
  ...props
}: TextareaWithCountProps) {
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <WordCount text={value} showCharacters={showCharacters} />
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={`flex min-h-[60px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className}`}
        {...props}
      />
      {!label && <WordCount text={value} showCharacters={showCharacters} />}
    </div>
  );
}