import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import { AppLayout } from "@/components/layout/AppLayout";
import { OnboardingTutorial } from "@/components/onboarding/OnboardingTutorial";
import { useOnboarding } from "@/hooks/useOnboarding";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DNALab from "./pages/dna-lab";
import Personas from "./pages/Personas";
import Pricing from "./pages/Pricing";
import Writer from "./pages/writer";
import Notes from "./pages/Notes";
import Settings from "./pages/Settings";
import TubeClone from "./pages/TubeClone";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper with onboarding
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AppLayout>
      {showOnboarding && (
        <OnboardingTutorial
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
        />
      )}
      {children}
    </AppLayout>
  );
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/pricing" element={<Pricing />} />
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/dna-lab" element={<ProtectedRoute><DNALab /></ProtectedRoute>} />
    <Route path="/personas" element={<ProtectedRoute><Personas /></ProtectedRoute>} />
    <Route path="/writer" element={<ProtectedRoute><Writer /></ProtectedRoute>} />
    <Route path="/writer/:id" element={<ProtectedRoute><Writer /></ProtectedRoute>} />
    <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
    <Route path="/tubeclone" element={<ProtectedRoute><TubeClone /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
