import React, { useState } from "react";
import {
  Sparkles,
  X,
  RefreshCw,
  Quote,
  TrendingUp,
  Layers,
  HeartHandshake,
  AlertCircle,
} from "lucide-react";
import { JournalEntry, JournalSynthesis } from "../types";
import { JournalApi } from "../services/api";
import { JournalStorage } from "../services/storage";

interface SynthesisModalProps {
  entries: JournalEntry[];
  cachedSynthesis: JournalSynthesis | null;
  onClose: () => void;
  userId: string;
}

export const SynthesisModal: React.FC<SynthesisModalProps> = ({
  entries,
  cachedSynthesis,
  onClose,
  userId,
}) => {
  const [synthesis, setSynthesis] = useState<JournalSynthesis | null>(cachedSynthesis);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunSynthesis = async () => {
    if (entries.length === 0) {
      setError("Please write at least one journal entry to synthesize reflections.");
      return;
    }

    try {
      setIsSynthesizing(true);
      setError(null);

      const payload = entries.slice(0, 12).map((e) => ({
        date: e.date,
        mood: e.mood,
        title: e.title,
        content: e.content,
      }));

      const result = await JournalApi.synthesizeEntries(payload);
      setSynthesis(result);
      JournalStorage.saveSynthesis(result, userId);
    } catch (err) {
      setError((err as Error)?.message || "Failed to generate mirror synthesis.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-stone-900">
                The Mirror: Emotional Synthesis
              </h2>
              <p className="text-xs text-stone-500">
                Multi-entry emotional trajectory & growth patterns across {entries.length} reflections
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Synthesis Encountered An Issue</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {!synthesis ? (
            <div className="text-center py-10 px-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-xl font-medium text-stone-800 mb-2">
                Unveil Your Emotional Arc
              </h3>
              <p className="text-sm text-stone-500 max-w-md mx-auto mb-6">
                Gemini will gently analyze your recent journal entries to uncover recurring themes, identify cognitive shifts, and celebrate milestones of inner resilience.
              </p>
              <button
                onClick={handleRunSynthesis}
                disabled={isSynthesizing || entries.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-sm font-medium transition-all shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-amber-300 ${isSynthesizing ? "animate-spin" : ""}`} />
                <span>{isSynthesizing ? "Consulting Gemini..." : "Synthesize My Reflections"}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="flex items-center justify-between bg-stone-50 rounded-xl p-3.5 border border-stone-200/80">
                <span className="text-xs font-medium text-stone-600">
                  Reflecting on {entries.length} recent entries
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                    {synthesis.modelUsed}
                  </span>
                  <button
                    onClick={handleRunSynthesis}
                    disabled={isSynthesizing}
                    className="text-xs font-medium text-amber-800 hover:text-amber-950 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSynthesizing ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Core Themes */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Prominent Life Themes</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {synthesis.coreThemes.map((theme, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>

              {/* Emotional Trajectory */}
              <div className="bg-stone-50/70 rounded-2xl p-5 border border-stone-200/80">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Emotional Trajectory & Perspective Shift</span>
                </div>
                <p className="font-serif text-base text-stone-800 leading-relaxed">
                  {synthesis.moodTrajectory}
                </p>
              </div>

              {/* Resilience Milestones */}
              {synthesis.growthMoments.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
                    <HeartHandshake className="w-4 h-4 text-rose-500" />
                    <span>Moments of Resilience Observed</span>
                  </div>
                  <ul className="space-y-2">
                    {synthesis.growthMoments.map((moment, idx) => (
                      <li
                        key={idx}
                        className="text-xs sm:text-sm font-serif text-stone-700 bg-white p-3 rounded-xl border border-stone-200/70 flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                        <span>{moment}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Encouragement Note */}
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/80">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 uppercase tracking-wider mb-2">
                  <Quote className="w-4 h-4 text-amber-700" />
                  <span>A Grounding Word from Gemini</span>
                </div>
                <p className="font-serif text-sm sm:text-base text-stone-800 leading-relaxed italic">
                  "{synthesis.encouragingNote}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
