import { ChevronLeft, Edit2, Check, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepIndicator } from "./StepIndicator";
import type { WriterStep } from "../types";

interface WriterHeaderProps {
    // Navigation
    currentStep: WriterStep;
    completedSteps: WriterStep[];
    onStepClick: (step: WriterStep) => void;
    onBack: () => void;

    // Title
    projectTitle: string;
    editingTitle: boolean;
    tempTitle: string;
    setTempTitle: (title: string) => void;
    onStartEditTitle: () => void;
    onSaveTitle: () => void;
    onCancelEditTitle: () => void;
}

export function WriterHeader({
    currentStep,
    completedSteps,
    onStepClick,
    onBack,
    projectTitle,
    editingTitle,
    tempTitle,
    setTempTitle,
    onStartEditTitle,
    onSaveTitle,
    onCancelEditTitle,
}: WriterHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Back
                </Button>
                <StepIndicator
                    currentStep={currentStep}
                    completedSteps={completedSteps}
                    onStepClick={onStepClick}
                />
            </div>
        </div>
    );
}

interface WriterTitleProps {
    projectTitle: string;
    editingTitle: boolean;
    tempTitle: string;
    setTempTitle: (title: string) => void;
    onStartEditTitle: () => void;
    onSaveTitle: () => void;
    onCancelEditTitle: () => void;
    currentStep: WriterStep;
}

export function WriterTitle({
    projectTitle,
    editingTitle,
    tempTitle,
    setTempTitle,
    onStartEditTitle,
    onSaveTitle,
    onCancelEditTitle,
    currentStep,
}: WriterTitleProps) {
    return (
        <div>
            {editingTitle ? (
                <div className="flex items-center gap-2">
                    <Input
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        className="text-xl font-bold h-9 max-w-md"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter") onSaveTitle();
                            if (e.key === "Escape") onCancelEditTitle();
                        }}
                    />
                    <Button size="icon" variant="ghost" onClick={onSaveTitle}>
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={onCancelEditTitle}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-2 group">
                    <h1
                        className="text-2xl font-bold tracking-tight cursor-pointer hover:text-primary transition-colors"
                        onClick={onStartEditTitle}
                    >
                        {projectTitle}
                    </h1>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={onStartEditTitle}
                    >
                        <Edit2 className="h-3 w-3" />
                    </Button>
                </div>
            )}
            <p className="text-muted-foreground">
                {currentStep === "input" && "Step 1: Enter your inputs"}
                {currentStep === "outline" && "Step 2: Review and edit outline"}
                {currentStep === "script" && "Step 3: Your generated script"}
            </p>
        </div>
    );
}
