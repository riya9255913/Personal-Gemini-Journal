import React, { useState } from "react";
import {
  BookOpen,
  Sparkles,
  ShieldCheck,
  Lock,
  MessageSquare,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Database,
  Cpu,
} from "lucide-react";
import { loginWithGoogle, loginAsGuest } from "../services/firebase";

interface LandingPageProps {
  onAuthenticated: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onAuthenticated }) => {
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);
  const [isLoggingInGuest, setIsLoggingInGuest] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoggingInGoogle(true);
      setAuthError(null);
      await loginWithGoogle();
      onAuthenticated();
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setAuthError(
        err?.message ||
          "Google Sign-In failed. If you are viewing in an iframe preview, popups may be blocked. Try guest mode or open in a new tab."
      );
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setIsLoggingInGuest(true);
      setAuthError(null);
      await loginAsGuest();
      onAuthenticated();
    } catch (err: any) {
      console.error("Guest sign in error:", err);
      setAuthError(err?.message || "Guest authentication failed.");
    } finally {
      setIsLoggingInGuest(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900 flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
      {/* Top Simple Brand Bar */}
      <header className="max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-50 flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <span className="font-serif text-xl font-semibold tracking-tight text-stone-900">
              Gemini Journal
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs text-stone-400 font-mono">
              v1.0 • Firestore + Auth
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Firestore Isolated
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-12 sm:py-20 text-center flex flex-col items-center">
        {/* Subtle Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/60 text-amber-900 border border-amber-200/80 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Private Reflections Powered by Gemini 3.6 Flash</span>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-stone-900 tracking-tight leading-[1.15] max-w-3xl mb-6">
          A tranquil sanctuary for your thoughts and honest dialogue.
        </h1>

        {/* Subtitle */}
        <p className="font-serif text-stone-600 text-lg sm:text-xl max-w-2xl leading-relaxed mb-10">
          Write freely. Converse with Gemini in multi-turn dialogues to gain fresh perspectives, brainstorm solutions, and reflect on your growth—secured in your personal Firestore vault.
        </p>

        {/* Auth Error Banner */}
        {authError && (
          <div className="max-w-md w-full mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs text-left flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold mb-0.5">Authentication Note</p>
              <p className="text-rose-700">{authError}</p>
            </div>
          </div>
        )}

        {/* CTA Login Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md mb-8">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoggingInGoogle || isLoggingInGuest}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 group"
          >
            {isLoggingInGoogle ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Signing in...
              </span>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>

          {/* Quick Preview / Anonymous Guest Sign-In */}
          <button
            onClick={handleGuestSignIn}
            disabled={isLoggingInGoogle || isLoggingInGuest}
            className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-medium text-sm flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50"
            title="Instant sign-in with unique anonymous Firebase Auth UID"
          >
            <UserCheck className="w-4 h-4 text-stone-500" />
            <span>{isLoggingInGuest ? "Connecting..." : "Guest Access"}</span>
          </button>
        </div>

        {/* Security & Privacy Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-stone-500 max-w-lg">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strict User Isolation in Firestore</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>No Shared or Leaked Reflections</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-amber-600" />
            <span>4-Tier Resilient Fallback</span>
          </div>
        </div>

        {/* Feature Grid Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16 text-left w-full">
          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-900 mb-2">
              Empathetic Reflections
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Every entry receives a structured Socratic reflection, identifying core emotions, energy states, and actionable takeaways.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-900 mb-2">
              Multi-Turn Conversations
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Converse with Gemini directly within any entry. Ask for stoic reframing, brainstorm ideas, or unpack underlying emotions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-900 mb-2">
              Cloud Firestore Vault
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Protected by rigorous Firestore rules (<code className="font-mono text-[11px] text-stone-700">request.auth.uid == userId</code>). Zero other users can view your thoughts.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 py-6 text-center text-xs text-stone-400">
        <p>Personal Gemini Journal • Authenticated & Isolated via Firebase & Google Cloud</p>
      </footer>
    </div>
  );
};
