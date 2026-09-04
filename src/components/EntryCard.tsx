import React, { useState } from "react";
import {
  Sparkles,
  Star,
  Calendar,
  Tag,
  Trash2,
  Edit3,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Quote,
  HelpCircle,
  Activity,
  MessageSquare,
} from "lucide-react";
import { JournalEntry } from "../types";

interface EntryCardProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onReanalyze: (entry: JournalEntry) => Promise<void>;
  onOpenConversation: (entry: JournalEntry) => void;
  isReanalyzing?: boolean;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  onEdit,
  onDelete,
  onToggleFavorite,
  onReanalyze,
  onOpenConversation,
  isReanalyzing = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    let text = `${entry.title}\n${entry.date} (Mood: ${entry.mood})\n\n${entry.content}`;
    if (entry.reflection) {
      text += `\n\n--- Gemini Reflection (${entry.reflection.modelUsed}) ---\n${entry.reflection.summary}\n\nTakeaway: ${entry.reflection.growthTakeaway}`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLong = entry.content.length > 350;
  const displayContent = isExpanded || !isLong ? entry.content : `${entry.content.slice(0, 350)}...`;

  return (
    <article
      id={`entry-${entry.id}`}
      className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-sm transition-all duration-200 overflow-hidden group"
    >
      {/* Top Meta Bar */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-stone-100/70">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            {entry.date}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
            {entry.mood}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleFavorite(entry.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              entry.favorite
                ? "text-amber-500 hover:text-amber-600 bg-amber-50"
                : "text-stone-300 hover:text-stone-500 hover:bg-stone-50"
            }`}
            title={entry.favorite ? "Favorited" : "Mark as favorite"}
          >
            <Star className={`w-4 h-4 ${entry.favorite ? "fill-amber-400" : ""}`} />
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
            title="Copy entry text"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onEdit(entry)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
            title="Edit entry"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(entry.id)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Entry Body */}
      <div className="p-6">
        <h3 className="font-serif text-xl sm:text-2xl font-medium text-stone-900 mb-3 tracking-tight">
          {entry.title || "Untitled Reflection"}
        </h3>

        <div className="font-serif text-stone-700 leading-relaxed text-base whitespace-pre-line">
          {displayContent}
        </div>

        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-xs font-medium text-stone-500 hover:text-stone-800 flex items-center gap-1 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Read full entry
              </>
            )}
          </button>
        )}

        {/* Tags */}
        {entry.tags.length > 0 && (
          <div className="mt-4 flex items-center gap-1.5 flex-wrap">
            <Tag className="w-3 h-3 text-stone-400" />
            {entry.tags.map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Gemini AI Reflection Container */}
        {entry.reflection ? (
          <div className="mt-6 rounded-xl bg-amber-50/60 border border-amber-200/80 p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 border-b border-amber-200/60 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="font-serif font-semibold text-xs tracking-wider uppercase text-amber-950">
                  Gemini Socratic Reflection
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-amber-800/80 bg-amber-100/60 px-2 py-0.5 rounded">
                  {entry.reflection.modelUsed}
                </span>
                <button
                  onClick={() => onReanalyze(entry)}
                  disabled={isReanalyzing}
                  className="text-amber-700 hover:text-amber-950 p-1 rounded hover:bg-amber-100/60 transition-colors"
                  title="Re-analyze with Gemini"
                >
                  <RefreshCw className={`w-3 h-3 ${isReanalyzing ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Summary */}
            <p className="font-serif text-sm text-stone-800 leading-relaxed italic mb-4">
              "{entry.reflection.summary}"
            </p>

            {/* Emotional Resonance & Cognitive Pattern */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              <div className="bg-white/80 rounded-lg p-2.5 border border-amber-100">
                <span className="text-[10px] font-semibold text-stone-500 uppercase block">
                  Core Resonance
                </span>
                <span className="text-xs font-medium text-stone-800">
                  {entry.reflection.emotionalResonance.primary}
                </span>
              </div>
              <div className="bg-white/80 rounded-lg p-2.5 border border-amber-100">
                <span className="text-[10px] font-semibold text-stone-500 uppercase block">
                  Energy State
                </span>
                <span className="text-xs font-medium text-stone-800">
                  {entry.reflection.emotionalResonance.energy}
                </span>
              </div>
              <div className="bg-white/80 rounded-lg p-2.5 border border-amber-100">
                <span className="text-[10px] font-semibold text-stone-500 uppercase block">
                  Cognitive Pattern
                </span>
                <span className="text-xs font-medium text-stone-800 line-clamp-1">
                  {entry.reflection.emotionalResonance.cognitivePattern}
                </span>
              </div>
            </div>

            {/* Socratic Inquiries */}
            {entry.reflection.socraticInquiries.length > 0 && (
              <div className="mb-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Curious Inquiries for Tomorrow:</span>
                </div>
                <ul className="space-y-1 pl-5 list-disc text-xs text-stone-700 font-serif">
                  {entry.reflection.socraticInquiries.map((q, idx) => (
                    <li key={idx} className="leading-snug">
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Growth Takeaway */}
            <div className="pt-2 border-t border-amber-200/50 flex items-start gap-2 text-xs text-amber-950 font-serif">
              <Quote className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong className="font-sans font-semibold text-[11px] uppercase tracking-wide text-amber-800 mr-1">
                  Growth Takeaway:
                </strong>
                {entry.reflection.growthTakeaway}
              </span>
            </div>
          </div>
        ) : null}

        {/* Action Bar: Multi-turn conversation & AI re-reflection */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => onOpenConversation(entry)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-all shadow-2xs group"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
            <span>Converse with Gemini</span>
            {entry.messages && entry.messages.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono bg-stone-700 text-amber-200 rounded-full">
                {entry.messages.length}
              </span>
            )}
          </button>

          {!entry.reflection && (
            <button
              onClick={() => onReanalyze(entry)}
              disabled={isReanalyzing}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-600 ${isReanalyzing ? "animate-spin" : ""}`} />
              <span>{isReanalyzing ? "Reflecting..." : "Generate Socratic Mirror"}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
