import { ReactNode, useState } from "react";
import { useSubscription, FeatureName, SubscriptionTier } from "@/hooks/useSubscription";
import { UpgradePrompt } from "./UpgradePrompt";

interface FeatureGateProps {
    /** The feature to check access for */
    feature: FeatureName;
    /** Content to render if user has access */
    children: ReactNode;
    /** Optional: Show upgrade prompt instead of hiding content */
    showUpgradePrompt?: boolean;
    /** Optional: Custom fallback content */
    fallback?: ReactNode;
    /** Optional: Hide completely instead of showing fallback */
    hideCompletely?: boolean;
}

/**
 * FeatureGate - Conditionally renders content based on subscription tier
 */
export function FeatureGate({
    feature,
    children,
    showUpgradePrompt = true,
    fallback,
    hideCompletely = false,
}: FeatureGateProps) {
    const { canAccessFeature, getRequiredTier, loading } = useSubscription();

    // Don't render anything while loading
    if (loading) {
        return null;
    }

    // User has access - render children
    if (canAccessFeature(feature)) {
        return <>{children}</>;
    }

    // User doesn't have access
    if (hideCompletely) {
        return null;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    if (showUpgradePrompt) {
        const requiredTier = getRequiredTier(feature);
        return <UpgradePrompt feature={feature} requiredTier={requiredTier} />;
    }

    return null;
}

/**
 * Helper component to wrap a button/element that requires a specific tier
 * Shows the element but makes it trigger upgrade prompt on click
 */
interface GatedButtonProps {
    feature: FeatureName;
    children: ReactNode;
    onClick?: () => void;
    className?: string;
}

export function GatedButton({ feature, children, onClick, className }: GatedButtonProps) {
    const { canAccessFeature, getRequiredTier } = useSubscription();
    const [showPrompt, setShowPrompt] = useState(false);

    const handleClick = () => {
        if (canAccessFeature(feature)) {
            onClick?.();
        } else {
            setShowPrompt(true);
        }
    };

    return (
        <>
            <div onClick={handleClick} className={className}>
                {children}
            </div>
            {showPrompt && (
                <UpgradePrompt
                    feature={feature}
                    requiredTier={getRequiredTier(feature)}
                    onClose={() => setShowPrompt(false)}
                    isModal
                />
            )}
        </>
    );
}

