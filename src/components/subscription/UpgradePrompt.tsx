import { Crown, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FeatureName, SubscriptionTier } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

// Feature display names and descriptions
const FEATURE_INFO: Record<FeatureName, { name: string; description: string }> = {
    dna_evolution: {
        name: "DNA Evolution",
        description: "Learn from new videos to improve your DNA profile",
    },
    ai_suggest_angle: {
        name: "AI Suggest Angle",
        description: "AI automatically suggests unique angles for your content",
    },
    batch_dna: {
        name: "Batch DNA",
        description: "Analyze multiple videos at once to create a combined DNA",
    },
    structure_innovation: {
        name: "Structure Innovation",
        description: "Allow AI to creatively transform script structure",
    },
    flop_analysis: {
        name: "Flop Analysis",
        description: "Analyze failed videos to avoid similar mistakes",
    },
};

const TIER_DISPLAY: Record<SubscriptionTier, { name: string; color: string }> = {
    starter: { name: "Starter", color: "bg-gray-500" },
    pro: { name: "Pro", color: "bg-gradient-to-r from-blue-500 to-purple-500" },
    ultra: { name: "Ultra", color: "bg-gradient-to-r from-amber-500 to-orange-500" },
};

interface UpgradePromptProps {
    feature: FeatureName;
    requiredTier: SubscriptionTier;
    isModal?: boolean;
    onClose?: () => void;
}

/**
 * UpgradePrompt - Shows upgrade CTA when user tries to access pro feature
 */
export function UpgradePrompt({ feature, requiredTier, isModal, onClose }: UpgradePromptProps) {
    const navigate = useNavigate();
    const featureInfo = FEATURE_INFO[feature];
    const tierInfo = TIER_DISPLAY[requiredTier];

    const handleUpgrade = () => {
        navigate("/pricing");
        onClose?.();
    };

    const content = (
        <div className="relative bg-gradient-to-br from-primary/5 via-transparent to-primary/10 border border-primary/20 rounded-xl p-4 space-y-3">
            {isModal && onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            )}

            <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                    <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h4 className="font-semibold text-sm">{featureInfo.name}</h4>
                    <p className="text-xs text-muted-foreground">{featureInfo.description}</p>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4">
                <Badge className={`${tierInfo.color} text-white border-0`}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Requires {tierInfo.name}
                </Badge>
                <Button size="sm" onClick={handleUpgrade} className="gap-1">
                    <Crown className="h-3 w-3" />
                    Upgrade
                </Button>
            </div>
        </div>
    );

    if (isModal) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="w-full max-w-md mx-4">{content}</div>
            </div>
        );
    }

    return content;
}

/**
 * Compact upgrade badge for inline display
 */
export function UpgradeBadge({ tier = "pro" }: { tier?: SubscriptionTier }) {
    const navigate = useNavigate();
    const tierInfo = TIER_DISPLAY[tier];

    return (
        <Badge
            className={`${tierInfo.color} text-white border-0 cursor-pointer hover:opacity-90 transition-opacity`}
            onClick={() => navigate("/pricing")}
        >
            <Crown className="h-3 w-3 mr-1" />
            {tierInfo.name}
        </Badge>
    );
}

