import { useState } from "react";
import { 
  Dna, 
  PenTool, 
  Users, 
  ChevronRight, 
  ChevronLeft, 
  X,
  Sparkles,
  Youtube,
  Target,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface OnboardingTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  {
    id: 1,
    title: "Welcome to ScriptLab!",
    description: "Your AI-powered content creation studio. Let's take a quick tour of the key features that will help you create viral content.",
    icon: Sparkles,
    color: "text-primary",
    tips: [
      "Create scripts based on proven viral formulas",
      "Extract DNA from successful videos",
      "Build personas for your target audience",
    ],
  },
  {
    id: 2,
    title: "DNA Extraction",
    description: "Extract the viral DNA from any YouTube video. Our AI analyzes successful content to identify patterns, hooks, pacing, and retention tactics.",
    icon: Dna,
    color: "text-purple-500",
    tips: [
      "Paste any YouTube URL to start extraction",
      "AI analyzes transcript, structure, and engagement",
      "Save DNA templates for future script generation",
    ],
    action: {
      label: "Try DNA Extraction",
      path: "/dna-lab",
    },
  },
  {
    id: 3,
    title: "Script Generation",
    description: "Generate viral-ready scripts using your extracted DNA templates. Choose between original ideas or rewriting existing content.",
    icon: PenTool,
    color: "text-blue-500",
    tips: [
      "Select a DNA template for consistent style",
      "Add viral and flop references for context",
      "Use version history to track changes",
    ],
    action: {
      label: "Create Your First Script",
      path: "/writer",
    },
  },
  {
    id: 4,
    title: "Audience Personas",
    description: "Define your target audience with detailed personas. The AI uses these to tailor content for maximum engagement.",
    icon: Users,
    color: "text-green-500",
    tips: [
      "Create personas with age range and preferences",
      "Define pain points and knowledge level",
      "Apply personas to scripts for targeted content",
    ],
    action: {
      label: "Create a Persona",
      path: "/personas",
    },
  },
  {
    id: 5,
    title: "Pro Tips",
    description: "Here are some tips to get the most out of ScriptLab and create content that resonates with your audience.",
    icon: Lightbulb,
    color: "text-yellow-500",
    tips: [
      "Add both viral AND flop references for balanced AI learning",
      "Use the score feature to evaluate script quality",
      "Organize scripts into folders for better management",
      "Check version history to restore previous drafts",
    ],
  },
];

export function OnboardingTutorial({ onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg border-border/50 shadow-2xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ${step.color}`}>
                <step.icon className="h-5 w-5" />
              </div>
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <Progress value={progress} className="mb-6 h-1" />

          {/* Content */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
            <p className="text-muted-foreground mb-4">{step.description}</p>
            
            <ul className="space-y-2">
              {step.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep 
                      ? "bg-primary" 
                      : index < currentStep 
                        ? "bg-primary/50" 
                        : "bg-muted"
                  }`}
                  onClick={() => setCurrentStep(index)}
                />
              ))}
            </div>

            <Button onClick={handleNext}>
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
