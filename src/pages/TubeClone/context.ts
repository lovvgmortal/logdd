import { createContext, useContext } from "react";
import { useTubeClone } from "@/hooks/useTubeClone";

export type TubeCloneContextType = ReturnType<typeof useTubeClone>;

export const TubeCloneContext = createContext<TubeCloneContextType | null>(null);

export function useTubeCloneContext() {
    const context = useContext(TubeCloneContext);
    if (!context) {
        throw new Error("useTubeCloneContext must be used within a TubeCloneProvider");
    }
    return context;
}
