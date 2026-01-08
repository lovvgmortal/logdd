import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card";
import { Sparkles, Mail, Lock, Loader2, User, Eye, EyeOff, ArrowRight, Dna, Zap, Target, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const { t, language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: t('auth.passwordTooShort'),
        description: t('auth.passwordTooShortDesc'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        let message = error.message;
        if (error.message.includes("Invalid login credentials")) {
          message = "Invalid email or password. Please try again.";
        } else if (error.message.includes("User already registered")) {
          message = "This email is already registered. Please sign in instead.";
        }
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } else if (!isLogin) {
        toast({
          title: t('auth.accountCreated'),
          description: t('auth.accountCreatedDesc'),
        });
        setIsLogin(true);
        setPassword("");
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Dna, text: t('auth.features.extractDna'), description: t('auth.features.extractDnaDesc') },
    { icon: Sparkles, text: t('auth.features.aiPowered'), description: t('auth.features.aiPoweredDesc') },
    { icon: Target, text: t('auth.features.personas'), description: t('auth.features.personasDesc') },
    { icon: Zap, text: t('auth.features.rapidIteration'), description: t('auth.features.rapidIterationDesc') },
  ];

  return (
    <div className="min-h-screen flex overflow-hidden relative">
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="gap-2 bg-background/50 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-primary/20 hover:text-primary transition-all duration-300"
        >
          <Globe className="h-4 w-4" />
          <span className="font-medium">{language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
        </Button>
      </div>
      {/* Left Side - Branding with animated background */}
      <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/30" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/20 backdrop-blur-sm p-3 border border-primary/20">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Viral DNA</span>
          </div>
        </div>

        <div className="relative z-10 space-y-10">
          <div>
            <h1 className="text-5xl font-bold tracking-tight leading-tight">
              {t('auth.unlockSecrets')}
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {t('auth.ofViralContent')}
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">
              {t('auth.heroDescription')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
              >
                <div className="rounded-xl bg-primary/10 p-2.5 w-fit mb-3 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-medium text-sm">{feature.text}</p>
                <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-sm text-muted-foreground">
          <span>© 2026 logdd. All rights reserved.</span>
          <Link to="/pricing" className="text-primary hover:underline">
            {t('auth.viewPricing')}
          </Link>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="rounded-2xl bg-primary/20 p-3">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <span className="text-2xl font-bold">Viral DNA</span>
          </div>

          <GlassCard className="border-0 shadow-2xl">
            <GlassCardHeader className="text-center pb-2">
              <GlassCardTitle className="text-2xl">
                {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
              </GlassCardTitle>
              <GlassCardDescription>
                {isLogin
                  ? t('auth.enterCredentials')
                  : t('auth.startCreating')}
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="pt-4 space-y-6">
              {/* Google Sign In Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl h-12 gap-3 font-medium hover:bg-accent/50 transition-all"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    {t('auth.continueWithGoogle')}
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">{t('auth.orContinueWith')}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('auth.fullName')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder={t('auth.namePlaceholder')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 rounded-xl h-12"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-xl h-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t('auth.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 rounded-xl h-12"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {!isLogin && (
                    <p className="text-xs text-muted-foreground">
                      {t('auth.passwordMinLength')}
                    </p>
                  )}
                </div>

                {isLogin && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full rounded-xl h-12 gap-2 font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? t('auth.signIn') : t('auth.createAccountAction')}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  {isLogin ? t('auth.noAccount') + " " : t('auth.hasAccount') + " "}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setPassword("");
                  }}
                  className="font-semibold text-primary hover:underline"
                >
                  {isLogin ? t('auth.signUpAction') : t('auth.signInAction')}
                </button>
              </div>

              {!isLogin && (
                <p className="text-xs text-center text-muted-foreground">
                  {t('auth.termsAgreement')}{" "}
                  <a href="#" className="text-primary hover:underline">{t('auth.termsOfService')}</a>
                  {" "}{t('auth.and')}{" "}
                  <a href="#" className="text-primary hover:underline">{t('auth.privacyPolicy')}</a>
                </p>
              )}
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
