
import React, { useState } from 'react';
import { PenIcon, UserIcon, ArrowRightIcon, SpinnerIcon } from '../Icons';

type RoutePath = '/home' | '/home/dashboard' | '/home/creating' | '/home/notes' | '/home/pricing';

interface LandingViewProps {
  onNavigate: (path: RoutePath) => void;
  onAuth: (email: string, pass: string, isSignUp: boolean) => Promise<void>;
  authLoading: boolean;
}

// Navbar simplified
export const LandingNavbar = ({ onNavigate }: { onNavigate: (path: RoutePath) => void }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-md bg-black/70 border-b border-white/5 transition-all">
    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('/home')}>
      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-transform">
        <PenIcon className="w-5 h-5 text-black" />
      </div>
      <span className="text-xl font-black text-white tracking-tighter">LOG</span>
    </div>
  </nav>
);

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate, onAuth, authLoading }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onAuth(email, password, isSignUp);
    }
  };

  return (
    <div className="relative text-center px-4 overflow-hidden min-h-[80vh] flex flex-col justify-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 space-y-8 max-w-4xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          <span className="block text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-zinc-400 to-zinc-700 mt-2">
            The Logic of Virality
          </span>
        </h1>
        <p className="text-lg md:text-2xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-light animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Stop guessing. Start engineering. LOG analyzes successful content DNA to rewrite your scripts for maximum retention.
        </p>

        {/* Email Login Form */}
        <div className="max-w-sm mx-auto bg-zinc-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
           <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                  <input 
                    type="email" 
                    placeholder="Email address" 
                    className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
              </div>
              <div>
                  <input 
                    type="password" 
                    placeholder="Password" 
                    className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
              </div>
              <button 
                type="submit" 
                disabled={authLoading}
                className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
              >
                {authLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : (isSignUp ? "Create Account" : "Sign In")}
              </button>
           </form>
           
           <div className="mt-4 text-xs text-zinc-500">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-white font-bold hover:underline"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};
