import React, { useState } from "react";
import {
  Sparkles,
  Save,
  X,
  Tag,
  Calendar,
  Smile,
  Lightbulb,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { JournalEntry, PromptSuggestion } from "../types";
import { JournalApi } from "../services/api";

const MOODS = [
  { label: "Peaceful", emoji: "🌿", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { label: "Reflective", emoji: "🪞", color: "bg-amber-50 text-amber-800 border-amber-200" },
  { label: "Grateful", emoji: "✨", color: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  { label: "Energetic", emoji: "⚡", color: "bg-orange-50 text-orange-800 border-orange-200" },
  { label: "Vulnerable", emoji: "🌱", color: "bg-rose-50 text-rose-800 border-rose-200" },
  { label: "Anxious", emoji: "🌧️", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { label: "Inspired", emoji: "💡", color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  { label: "Melancholic", emoji: "🍂", color: "bg-stone-100 text-stone-700 border-stone-300" },
];

interface EntryEditorProps {
  initialEntry?: JournalEntry | null;
  onSave: (entry: JournalEntry, requestAiReflection: boolean) => Promise<void>;
  onCancel: () => void;
  userId: string;
}

export const EntryEditor: React.FC<EntryEditorProps> = ({
  initialEntry,
  onSave,
  onCancel,
  userId,
}) => {
  const [title, setTitle] = useState(initialEntry?.title || "");
  const [content, setContent] = useState(initialEntry?.content || "");
  const [date, setDate] = useState(
    initialEntry?.date || new Date().toISOString().slice(0, 10)
  );
  const [mood, setMood] = useState(initialEntry?.mood || "Reflective");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || []);
  
  // AI Assist States
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<PromptSuggestion[]>([]);
  const [isSavingWithAi, setIsSavingWithAi] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    const clean = tagInput.trim().replace(/^#/, "");
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleFetchPrompts = async () => {
    try {
      setIsLoadingPrompts(true);
      setErrorMessage(null);
      const res = await JournalApi.generatePrompts({
        currentDraft: content,
        preferredMood: mood,
      });
      setSuggestedPrompts(res.prompts);
    } catch (err) {
      setErrorMessage((err as Error)?.message || "Failed to generate inquiry prompts.");
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const handleUsePrompt = (promptText: string) => {
    setContent((prev) => {
      if (!prev.trim()) return promptText + "\n\n";
      return prev.trim() + "\n\n---\nPrompt Inquiry: " + promptText + "\n";
    });
  };

  const handleSaveAttempt = async (withAi: boolean) => {
    if (!content.trim()) {
      setErrorMessage("Please write some thoughts before saving.");
      return;
    }

    setErrorMessage(null);
    if (withAi) {
      setIsSavingWithAi(true);
    } else {
      setIsSavingManual(true);
    }

    try {
      const entryId = initialEntry?.id || `entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const entry: JournalEntry = {
        id: entryId,
        userId,
        title: title.trim() || "Untitled Reflection",
        content: content.trim(),
        date,
        mood,
        tags,
        favorite: initialEntry?.favorite || false,
        reflection: initialEntry?.reflection,
        createdAt: initialEntry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(entry, withAi);
      setSuccessNotice(withAi ? "Saved and reflected with Gemini!" : "Saved to your private vault!");
    } catch (err) {
      setErrorMessage((err as Error)?.message || "Failed to save entry. Your input has been safely preserved.");
    } finally {
      setIsSavingWithAi(false);
      setIsSavingManual(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden transition-all">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/40">
        <div>
          <h2 className="font-serif text-xl font-medium text-stone-900">
            {initialEntry ? "Edit Reflection" : "New Journal Entry"}
          </h2>
          <p className="text-xs text-stone-500">
            Encrypted & owner-isolated in your personal vault
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Banner with Retry Guarantee */}
      {errorMessage && (
        <div className="mx-6 mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-rose-900">Save Encountered An Issue</p>
            <p className="text-rose-700 mt-0.5">{errorMessage}</p>
            <p className="text-xs text-rose-600 mt-1">
              Zero-loss guarantee: Your writing in the box below is safe and intact.
            </p>
          </div>
          <button
            onClick={() => handleSaveAttempt(true)}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium shrink-0"
          >
            Retry Save
          </button>
        </div>
      )}

      {/* Success Notice */}
      {successNotice && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Form Fields */}
      <div className="p-6 space-y-5">
        {/* Title Input */}
        <div>
          <input
            type="text"
            placeholder="Give this reflection a title (or leave for auto)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-serif text-xl sm:text-2xl font-medium placeholder:text-stone-300 text-stone-900 border-b border-stone-200 pb-2 focus:border-stone-900 focus:outline-none transition-colors"
          />
        </div>

        {/* Date and Mood selector */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {/* Date Picker */}
          <div className="flex items-center gap-2 text-stone-600 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200/80">
            <Calendar className="w-4 h-4 text-stone-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-stone-700 font-medium text-xs focus:outline-none"
            />
          </div>

          {/* Mood Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-stone-400 flex items-center gap-1 mr-1">
              <Smile className="w-3.5 h-3.5" /> Mood:
            </span>
            {MOODS.map((m) => {
              const isSelected = mood === m.label;
              return (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setMood(m.label)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${
                    isSelected
                      ? `${m.color} ring-2 ring-stone-900/10 shadow-xs font-semibold scale-105`
                      : "bg-white text-stone-600 border-stone-200/80 hover:bg-stone-50"
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="relative">
          <textarea
            placeholder="What is present for you today? Describe your feelings, events, challenges, or quiet discoveries..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full p-4 rounded-xl font-serif text-base sm:text-lg leading-relaxed text-stone-800 placeholder:text-stone-300 border border-stone-200/80 focus:border-stone-400 focus:ring-1 focus:ring-stone-400 focus:outline-none transition-all resize-y"
          />

          <div className="mt-1 flex items-center justify-between text-xs text-stone-400 px-1">
            <span>
              {content.trim() ? `${content.trim().split(/\s+/).length} words` : "0 words"} •{" "}
              {Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200))} min read
            </span>
            <span>Markdown supported</span>
          </div>
        </div>

        {/* AI Deepening Inquiry Starters */}
        <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
                Socratic Inquiry Assist
              </span>
            </div>
            <button
              type="button"
              onClick={handleFetchPrompts}
              disabled={isLoadingPrompts}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:text-amber-950 bg-amber-100/60 hover:bg-amber-100 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingPrompts ? "animate-spin" : ""}`} />
              <span>{isLoadingPrompts ? "Consulting Gemini..." : "Deepen My Writing"}</span>
            </button>
          </div>

          {suggestedPrompts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-2">
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleUsePrompt(p.prompt)}
                  className="text-left p-3 rounded-lg bg-white/90 border border-amber-200/80 hover:border-amber-400 hover:shadow-xs transition-all group"
                >
                  <span className="text-[10px] font-semibold text-amber-700 block uppercase">
                    {p.category}
                  </span>
                  <p className="text-xs font-serif text-stone-800 mt-1 line-clamp-3 group-hover:text-stone-900">
                    "{p.prompt}"
                  </p>
                  <span className="text-[10px] text-stone-400 block mt-1">Click to append</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-800/80 font-serif">
              Stuck or looking for a deeper perspective? Click "Deepen My Writing" to receive 3 tailored reflective prompts based on your current draft.
            </p>
          )}
        </div>

        {/* Tags Section */}
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Tag className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-xs font-medium text-stone-500">Tags:</span>
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-stone-100 text-stone-700 border border-stone-200"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="text-stone-400 hover:text-stone-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-sm">
            <input
              type="text"
              placeholder="Add tag and press Enter..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 focus:border-stone-400 focus:outline-none flex-1"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium"
            >
              Add
            </button>
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-400 flex items-center gap-2">
            <span>Fallback Ladder: gemini-3.6-flash → gemini-3.1-flash-lite</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSaveAttempt(false)}
              disabled={isSavingManual || isSavingWithAi}
              className="px-4 py-2 rounded-xl text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-stone-500" />
              <span>{isSavingManual ? "Saving..." : "Save Draft Only"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveAttempt(true)}
              disabled={isSavingWithAi || isSavingManual}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 text-amber-300 ${isSavingWithAi ? "animate-spin" : ""}`} />
              <span>{isSavingWithAi ? "Reflecting with Gemini..." : "Save & Reflect with Gemini"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
