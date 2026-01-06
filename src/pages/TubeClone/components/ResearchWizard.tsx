import { useState, useEffect } from "react";
import { ChevronRight, Check, Settings, Search, Filter, Cpu, PenTool, BarChart3, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTubeClone } from "@/hooks/useTubeClone";
import { TubeCloneContext } from "../context";
import { StepConfig } from "./StepConfig";
import { StepSearch } from "./StepSearch";
import { StepFilter } from "./StepFilter";
import { StepEmbed } from "./StepEmbed";
import { StepInput } from "./StepInput";
import { StepAnalysis } from "./StepAnalysis";
import { StepValidation } from "./StepValidation";
import type { TubeCloneProject, ResearchStep } from "../types";

interface ResearchWizardProps {
    project: TubeCloneProject;
}

const STEPS: { id: ResearchStep; label: string; icon: React.ElementType }[] = [
    { id: "config", label: "Config", icon: Settings },
    { id: "search", label: "Search", icon: Search },
    { id: "filter", label: "Filter", icon: Filter },
    { id: "embed", label: "Embed", icon: Cpu },
    { id: "input", label: "Input", icon: PenTool },
    { id: "analysis", label: "Analysis", icon: BarChart3 },
    { id: "validation", label: "Validate", icon: CheckCircle },
];

function statusToStep(status: string): ResearchStep {
    switch (status) {
        case "searching": return "search";
        case "filtering": return "filter";
        case "embedding": return "embed";
        case "analyzing": return "input";
        case "done": return "validation";
        default: return "config";
    }
}

interface VideoPreview {
    title: string;
    description: string;
    tags: string[];
    categoryId: string;
    publishedAt: string;
    channelTitle: string;
    thumbnailUrl: string;
}

export function ResearchWizard({ project }: ResearchWizardProps) {
    // Initialize shared hook here
    const tubeCloneState = useTubeClone();
    const { loadProject, currentProject, videos } = tubeCloneState;

    const [isLoading, setIsLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState<ResearchStep>("config");
    const [highestReachedStep, setHighestReachedStep] = useState<ResearchStep>("config");
    const [initialStepSet, setInitialStepSet] = useState(false);

    // Shared localized state
    const [configState, setConfigState] = useState({
        name: project.name,
        sourceUrl: project.source_url || "",
        country: project.country || "US",
        hoursRange: 24 * 30,
        videoLimit: project.video_limit || 50,
        videoPreview: null as VideoPreview | null,
        detectedNiche: project.niche || "",
    });

    const [userInput, setUserInput] = useState({
        title: "",
        description: "",
        tags: "",
    });

    // Load project from DB
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            await loadProject(project.id);
            setIsLoading(false);
        };
        load();
    }, [project.id]);

    // Sync state with loaded project - ONLY on initial load
    useEffect(() => {
        if (!isLoading && currentProject && !initialStepSet) {
            // Set initial step based on status only on first load
            const step = statusToStep(currentProject.status);
            setCurrentStep(step);
            setHighestReachedStep(step); // Also set highest reached step
            setInitialStepSet(true);

            setConfigState(prev => ({
                ...prev,
                name: currentProject.name,
                sourceUrl: currentProject.source_url || "",
                country: currentProject.country || "US",
                videoLimit: currentProject.video_limit || 50,
                detectedNiche: currentProject.niche || "",
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, initialStepSet]); // Removed currentProject to prevent re-triggering

    const getStepStatus = (stepId: ResearchStep): "completed" | "current" | "upcoming" => {
        const stepIndex = STEPS.findIndex(s => s.id === stepId);
        const currentIndex = STEPS.findIndex(s => s.id === currentStep);
        const highestIndex = STEPS.findIndex(s => s.id === highestReachedStep);

        // Allow navigation to any step up to the highest reached step
        if (stepIndex <= highestIndex && stepIndex < currentIndex) return "completed";
        if (stepIndex === currentIndex) return "current";
        return "upcoming";
    };

    const handleNext = () => {
        const currentIndex = STEPS.findIndex(s => s.id === currentStep);
        if (currentIndex < STEPS.length - 1) {
            const nextStep = STEPS[currentIndex + 1].id;
            setCurrentStep(nextStep);

            // Update highest reached step if moving forward
            const highestIndex = STEPS.findIndex(s => s.id === highestReachedStep);
            if (currentIndex + 1 > highestIndex) {
                setHighestReachedStep(nextStep);
            }
        }
    };

    const handleBack = () => {
        const currentIndex = STEPS.findIndex(s => s.id === currentStep);
        if (currentIndex > 0) {
            setCurrentStep(STEPS[currentIndex - 1].id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading project...</span>
            </div>
        );
    }

    const renderStepContent = () => {
        // Current project from hook might be null initially or same as prop
        // Use currentProject if available, else prop project
        const activeProject = currentProject || project;

        return (
            <>
                {currentStep === "config" && (
                    <StepConfig
                        project={activeProject}
                        configState={configState}
                        setConfigState={setConfigState}
                        onNext={handleNext}
                    />
                )}
                {currentStep === "search" && (
                    <StepSearch
                        project={activeProject}
                        onNext={handleNext}
                        onBack={handleBack}
                        autoStart={videos.length === 0}
                    />
                )}
                {currentStep === "filter" && (
                    <StepFilter project={activeProject} onNext={handleNext} onBack={handleBack} />
                )}
                {currentStep === "embed" && (
                    <StepEmbed project={activeProject} onNext={handleNext} onBack={handleBack} />
                )}
                {currentStep === "input" && (
                    <StepInput
                        project={activeProject}
                        userInput={userInput}
                        setUserInput={setUserInput}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}
                {currentStep === "analysis" && (
                    <StepAnalysis
                        project={activeProject}
                        userInput={userInput}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}
                {currentStep === "validation" && (
                    <StepValidation
                        project={activeProject}
                        userInput={userInput}
                        onBack={handleBack}
                    />
                )}
            </>
        );
    };

    return (
        <TubeCloneContext.Provider value={tubeCloneState}>
            <div className="space-y-6">
                {/* Step Progress */}
                <div className="flex items-center justify-between overflow-x-auto pb-2">
                    {STEPS.map((step, index) => {
                        const status = getStepStatus(step.id);
                        const Icon = step.icon;

                        const isClickable = status !== "upcoming";

                        return (
                            <div key={step.id} className="flex items-center">
                                <button
                                    onClick={() => isClickable && setCurrentStep(step.id)}
                                    disabled={!isClickable}
                                    className={cn(
                                        "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all",
                                        status === "completed" && "text-primary cursor-pointer hover:bg-primary/10",
                                        status === "current" && "text-primary bg-primary/10",
                                        status === "upcoming" && "text-muted-foreground/50 cursor-not-allowed"
                                    )}
                                >
                                    <div className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                                        status === "completed" && "border-primary bg-primary text-primary-foreground",
                                        status === "current" && "border-primary bg-primary/20",
                                        status === "upcoming" && "border-muted-foreground/30"
                                    )}>
                                        {status === "completed" ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <Icon className="h-4 w-4" />
                                        )}
                                    </div>
                                    <span className="text-xs font-medium whitespace-nowrap">{step.label}</span>
                                </button>

                                {index < STEPS.length - 1 && (
                                    <ChevronRight className={cn(
                                        "h-4 w-4 mx-1 flex-shrink-0",
                                        status === "completed" ? "text-primary" : "text-muted-foreground/30"
                                    )} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Step Content */}
                <div className="min-h-[400px]">
                    {renderStepContent()}
                </div>
            </div>
        </TubeCloneContext.Provider>
    );
}
