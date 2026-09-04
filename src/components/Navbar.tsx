import React from "react";
import { BookOpen, ShieldCheck, Sparkles, Download, Plus, Cpu, LogOut, User as UserIcon } from "lucide-react";
import { ModelHealthInfo } from "../types";
import { User } from "firebase/auth";

interface NavbarProps {
  modelHealth: ModelHealthInfo;
  onNewEntry: () => void;
  onOpenSynthesis: () => void;
  onOpenThreatModel: () => void;
  onOpenBackup: () => void;
  user: User | null;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  modelHealth,
  onNewEntry,
  onOpenSynthesis,
  onOpenThreatModel,
  onOpenBackup,
  user,
  onSignOut,
}) => {
  const displayName = user?.displayName || (user?.isAnonymous ? "Guest Seeker" : user?.email?.split("@")[0] || "Seeker");
  const photoUrl = user?.photoURL;

  return (
    <header className="sticky top-0 z-30 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-50 flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-stone-900">
                Gemini Journal
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100/70 text-amber-800 border border-amber-200/60">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Resilient AI
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden md:block">
              Private, introspective thoughts guided by Socratic reflection
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Model Status Indicator */}
          <button
            onClick={onOpenThreatModel}
            title={`Active Model Ladder: ${modelHealth.ladder.join(" → ")}`}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-stone-100 hover:bg-stone-200/80 text-stone-700 border border-stone-200 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold">{modelHealth.primaryModel}</span>
            <span className="text-stone-400">|</span>
            <span className="text-emerald-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Ladder Active
            </span>
          </button>

          {/* Synthesis / The Mirror */}
          <button
            onClick={onOpenSynthesis}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/80 shadow-2xs transition-all"
            title="Emotional Mirror & Multi-Entry Synthesis"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">The Mirror</span>
          </button>

          {/* Security & Threat Model Audit */}
          <button
            onClick={onOpenThreatModel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/80 shadow-2xs transition-all"
            title="Agentic Threat Model & Security Audit"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">Security</span>
          </button>

          {/* Backup / Export */}
          <button
            onClick={onOpenBackup}
            className="p-2 rounded-lg text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200/80 shadow-2xs transition-all"
            title="Backup & Vault Export/Import"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-stone-200">
            <div className="flex items-center gap-2">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={displayName}
                  className="w-7 h-7 rounded-full object-cover border border-stone-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden xl:inline-block text-xs font-medium text-stone-700 max-w-[100px] truncate">
                {displayName}
              </span>
            </div>

            <button
              onClick={onSignOut}
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Write New Entry */}
          <button
            onClick={onNewEntry}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 shadow-xs active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">New Entry</span>
          </button>
        </div>
      </div>
    </header>
  );
};
