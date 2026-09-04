import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Star,
  BookOpen,
  Calendar,
  ShieldCheck,
  LogOut,
  Sparkles,
} from "lucide-react";
import { User } from "firebase/auth";
import { JournalEntry, JournalSynthesis, ModelHealthInfo } from "./types";
import { JournalStorage } from "./services/storage";
import { FirestoreJournalService } from "./services/firestoreStorage";
import { JournalApi } from "./services/api";
import { auth, onAuthStateChanged, logoutUser } from "./services/firebase";
import { Navbar } from "./components/Navbar";
import { LandingPage } from "./components/LandingPage";
import { EntryEditor } from "./components/EntryEditor";
import { EntryCard } from "./components/EntryCard";
import { ConversationModal } from "./components/ConversationModal";
import { SynthesisModal } from "./components/SynthesisModal";
import { ThreatModelModal } from "./components/ThreatModelModal";
import { BackupModal } from "./components/BackupModal";

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Core Data States
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [cachedSynthesis, setCachedSynthesis] = useState<JournalSynthesis | null>(null);
  const [modelHealth, setModelHealth] = useState<ModelHealthInfo>({
    status: "operational",
    primaryModel: "gemini-3.6-flash",
    ladder: ["gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.7-flash"],
    apiKeyConfigured: true,
  });

  // UI View States
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [activeConversationEntry, setActiveConversationEntry] = useState<JournalEntry | null>(null);
  const [activeModal, setActiveModal] = useState<"synthesis" | "threatModel" | "backup" | null>(null);
  const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("All");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const userId = currentUser ? currentUser.uid : "user_guest";

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync with Firestore on user change
  useEffect(() => {
    if (!currentUser) {
      setEntries([]);
      return;
    }

    // 1. Check API health & model ladder
    JournalApi.checkHealth().then((health) => {
      setModelHealth(health);
    });

    // 2. Load cached synthesis
    const synth = JournalStorage.loadSynthesis(userId);
    if (synth) setCachedSynthesis(synth);

    // 3. Real-time Firestore subscription isolated to request.auth.uid == userId
    const unsubscribeFirestore = FirestoreJournalService.subscribeToEntries(
      userId,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
      },
      (err) => {
        console.warn("Firestore subscription note:", err);
      }
    );

    return () => {
      unsubscribeFirestore();
    };
  }, [currentUser, userId]);

  // Filtered Entries Calculation
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (onlyFavorites && !entry.favorite) return false;
      if (selectedMood !== "All" && entry.mood !== selectedMood) return false;
      if (selectedTag && !entry.tags.includes(selectedTag)) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(query);
        const matchesContent = entry.content.toLowerCase().includes(query);
        const matchesTags = entry.tags.some((t) => t.toLowerCase().includes(query));
        const matchesReflection = entry.reflection
          ? entry.reflection.summary.toLowerCase().includes(query) ||
            entry.reflection.growthTakeaway.toLowerCase().includes(query)
          : false;

        return matchesTitle || matchesContent || matchesTags || matchesReflection;
      }

      return true;
    });
  }, [entries, onlyFavorites, selectedMood, selectedTag, searchQuery]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => e.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [entries]);

  // Handlers
  const handleSaveEntry = async (entry: JournalEntry, requestAiReflection: boolean) => {
    if (!currentUser) return;

    // 1. Guaranteed Input-to-Save Persistence in Firestore & Local Vault
    const saved = await FirestoreJournalService.saveEntry(userId, entry);

    // 2. Request Gemini Reflection if requested
    if (requestAiReflection) {
      try {
        const reflection = await JournalApi.generateReflection({
          title: saved.title,
          content: saved.content,
          mood: saved.mood,
          date: saved.date,
        });

        // 3. Persist generated reflection to Firestore
        const entryWithReflection: JournalEntry = {
          ...saved,
          reflection,
        };
        await FirestoreJournalService.saveEntry(userId, entryWithReflection);

        // Record interaction in /users/{userId}/interactions
        await FirestoreJournalService.recordInteraction(userId, {
          entryId: saved.id,
          type: "reflection",
          prompt: saved.content,
          response: reflection.summary,
          modelUsed: reflection.modelUsed,
        });
      } catch (err) {
        console.error("Gemini reflection failed after saving entry:", err);
        throw err;
      }
    }

    setIsCreatingNew(false);
    setEditingEntry(null);
  };

  const handleReanalyze = async (entry: JournalEntry) => {
    if (!currentUser) return;
    try {
      setReanalyzingId(entry.id);
      const reflection = await JournalApi.generateReflection({
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
        date: entry.date,
      });

      const updated = { ...entry, reflection };
      await FirestoreJournalService.saveEntry(userId, updated);

      await FirestoreJournalService.recordInteraction(userId, {
        entryId: entry.id,
        type: "reflection",
        prompt: entry.content,
        response: reflection.summary,
        modelUsed: reflection.modelUsed,
      });
    } catch (err) {
      console.error("Re-analysis failed:", err);
    } finally {
      setReanalyzingId(null);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!currentUser) return;
    if (window.confirm("Are you sure you want to delete this reflection from your Firestore vault?")) {
      await FirestoreJournalService.deleteEntry(userId, id);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    if (!currentUser) return;
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    const updated = { ...entry, favorite: !entry.favorite };
    await FirestoreJournalService.saveEntry(userId, updated);
  };

  const handleSignOut = async () => {
    await logoutUser();
  };

  const handleImportComplete = () => {
    if (currentUser) {
      const loaded = JournalStorage.loadEntries(userId);
      // Push each imported entry into Firestore
      loaded.forEach((e) => FirestoreJournalService.saveEntry(userId, e));
    }
  };

  // Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-50 flex items-center justify-center animate-pulse">
            <BookOpen className="w-5 h-5 text-amber-200" />
          </div>
          <p className="font-serif text-sm text-stone-500">Preparing your private journal sanctuary...</p>
        </div>
      </div>
    );
  }

  // User Flow Step 1: Landing Page & Sign In prompt
  if (!currentUser) {
    return <LandingPage onAuthenticated={() => {}} />;
  }

  // User Flow Step 2-6: Private Authenticated Dashboard
  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Top Navigation */}
      <Navbar
        modelHealth={modelHealth}
        onNewEntry={() => {
          setEditingEntry(null);
          setIsCreatingNew(true);
        }}
        onOpenSynthesis={() => setActiveModal("synthesis")}
        onOpenThreatModel={() => setActiveModal("threatModel")}
        onOpenBackup={() => setActiveModal("backup")}
        user={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Editor Modal / Inline Form */}
        {(isCreatingNew || editingEntry) && (
          <div className="mb-10">
            <EntryEditor
              initialEntry={editingEntry}
              onSave={handleSaveEntry}
              onCancel={() => {
                setIsCreatingNew(false);
                setEditingEntry(null);
              }}
              userId={userId}
            />
          </div>
        )}

        {/* Quiet Editorial Welcome & Stats */}
        {!isCreatingNew && !editingEntry && (
          <section className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-stone-200/80">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Private Firestore Vault
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                    UID: {currentUser.uid.slice(0, 8)}...
                  </span>
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight">
                  Reflections & Dialogue
                </h2>
                <p className="font-serif text-stone-600 text-sm sm:text-base mt-1 max-w-xl">
                  A sanctuary for authentic inquiry. Converse with Gemini on any reflection, explore fresh perspectives, and track your emotional evolution.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 shadow-sm transition-all active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4 text-amber-300" />
                  <span>Write Reflection</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="mt-6 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search reflections, conversations, or themes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-white border border-stone-200/80 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Favorites Toggle */}
                <button
                  onClick={() => setOnlyFavorites(!onlyFavorites)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all flex items-center gap-1.5 shrink-0 ${
                    onlyFavorites
                      ? "bg-amber-100/70 text-amber-900 border-amber-300 shadow-2xs"
                      : "bg-white text-stone-600 border-stone-200/80 hover:bg-stone-50"
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-amber-500 text-amber-600" : "text-stone-400"}`} />
                  <span>Favorites</span>
                </button>
              </div>

              {/* Mood Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs">
                <span className="text-stone-400 mr-1 text-[11px] uppercase font-semibold">Mood:</span>
                {["All", "Peaceful", "Reflective", "Grateful", "Energetic", "Vulnerable", "Anxious", "Inspired", "Melancholic"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMood(m)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap transition-all ${
                      selectedMood === m
                        ? "bg-stone-900 text-white font-medium shadow-2xs"
                        : "bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Active Tags */}
              {allTags.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-1">
                  <span className="text-stone-400 mr-1 text-[11px] uppercase font-semibold">Tags:</span>
                  {selectedTag && (
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="px-2.5 py-0.5 rounded-md bg-stone-200 text-stone-700 font-medium"
                    >
                      Clear tag ({selectedTag} &times;)
                    </button>
                  )}
                  {allTags.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                      className={`px-2.5 py-0.5 rounded-md transition-all ${
                        selectedTag === t
                          ? "bg-stone-800 text-white font-medium"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200/80"
                      }`}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Entries List / Past Entries History */}
        <div className="space-y-6">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={(e) => {
                  setEditingEntry(e);
                  setIsCreatingNew(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onDelete={handleDeleteEntry}
                onToggleFavorite={handleToggleFavorite}
                onReanalyze={handleReanalyze}
                onOpenConversation={(e) => setActiveConversationEntry(e)}
                isReanalyzing={reanalyzingId === entry.id}
              />
            ))
          ) : (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-stone-200/90 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-medium text-stone-800 mb-1">
                {searchQuery || selectedMood !== "All" || onlyFavorites
                  ? "No matching reflections found"
                  : "Your Firestore vault is ready"}
              </h3>
              <p className="text-sm text-stone-500 max-w-sm mx-auto mb-5 font-serif">
                {searchQuery || selectedMood !== "All" || onlyFavorites
                  ? "Try adjusting your search criteria or mood filters to see other entries."
                  : "Begin your reflective journey. Share what is present for you today and invite Gemini's thoughtful inquiry."}
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedMood("All");
                  setOnlyFavorites(false);
                  setSelectedTag(null);
                  setIsCreatingNew(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs sm:text-sm font-medium hover:bg-stone-800 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Write Your First Reflection</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200/80 bg-white/70 py-6 text-xs text-stone-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-stone-800">Personal Gemini Journal</span>
            <span>•</span>
            <span className="font-mono text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Firestore Isolated & OWASP Compliant
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveModal("threatModel")}
              className="hover:text-stone-800 transition-colors"
            >
              Security Architecture
            </button>
            <button
              onClick={() => setActiveModal("backup")}
              className="hover:text-stone-800 transition-colors"
            >
              Export & Backup
            </button>
            <button
              onClick={handleSignOut}
              className="hover:text-rose-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </footer>

      {/* Multi-Turn Conversation Modal */}
      {activeConversationEntry && (
        <ConversationModal
          entry={activeConversationEntry}
          userId={userId}
          onClose={() => setActiveConversationEntry(null)}
          onEntryUpdated={(updated) => {
            setActiveConversationEntry(updated);
            setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
          }}
        />
      )}

      {/* Synthesis Modal */}
      {activeModal === "synthesis" && (
        <SynthesisModal
          entries={entries}
          cachedSynthesis={cachedSynthesis}
          onClose={() => setActiveModal(null)}
          userId={userId}
        />
      )}

      {/* Threat Model Modal */}
      {activeModal === "threatModel" && (
        <ThreatModelModal onClose={() => setActiveModal(null)} />
      )}

      {/* Backup Modal */}
      {activeModal === "backup" && (
        <BackupModal
          entries={entries}
          onImportComplete={handleImportComplete}
          onClose={() => setActiveModal(null)}
          userId={userId}
        />
      )}
    </div>
  );
}
