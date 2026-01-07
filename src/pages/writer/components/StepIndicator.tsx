import { ChevronRight, Check } from "lucide-react";
import type { WriterStep } from "../types";

interface StepIndicatorProps {
    currentStep: WriterStep;
    completedSteps: WriterStep[];
    onStepClick: (step: WriterStep) => void;
}

const STEPS: { key: WriterStep; label: string }[] = [
    { key: "input", label: "Input" },
    { key: "outline", label: "Outline" },
    { key: "script", label: "Script" },
];

export function StepIndicator({ currentStep, completedSteps, onStepClick }: StepIndicatorProps) {
    return (
        <div className="flex items-center gap-2 text-sm">
            {STEPS.map((step, index) => {
                const isCompleted = completedSteps.includes(step.key);
                const isCurrent = currentStep === step.key;
                const isClickable = step.key === "input" || isCompleted;

                return (
                    <div key={step.key} className="flex items-center gap-2">
                        <button
                            onClick={() => onStepClick(step.key)}
                            disabled={!isClickable}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${isCurrent
                                ? "bg-primary text-primary-foreground"
                                : isCompleted
                                    ? "bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                                }`}
                        >
                            {isCompleted && !isCurrent && <Check className="h-3 w-3" />}
                            <span className="font-medium">{step.label}</span>
                        </button>
                        {index < STEPS.length - 1 && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
