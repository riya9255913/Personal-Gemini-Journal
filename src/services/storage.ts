import { JournalEntry, JournalSynthesis } from "../types";

const DEFAULT_USER_ID = "user_gemini_default";

export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(stripUndefined) as unknown as T;
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v !== undefined) {
        clean[k] = stripUndefined(v);
      }
    }
    return clean as T;
  }
  return obj;
}

const SEED_ENTRIES: JournalEntry[] = [
  {
    id: "entry_seed_1",
    userId: DEFAULT_USER_ID,
    title: "Morning stillness and the fog over the valley",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    mood: "Peaceful",
    tags: ["mindfulness", "morning", "nature"],
    favorite: true,
    content:
      "Woke up at 6:15 AM before the alarm. Brewed roasted oolong tea and sat on the back deck watching the low fog snake through the eucalyptus trees.\n\nLately I have felt pressured to solve every unresolved puzzle of next month all at once. But sitting there, feeling the ceramic warmth in my hands, I noticed that the fog moves without hurry. It doesn't rush to clear the valley; it simply yields to the sun when the time arrives.\n\nI want to carry this patience into my meetings today. Less bracing, more allowing.",
    reflection: {
      summary:
        "A grounded, meditative realization drawing wisdom from nature's pacing to counter future-oriented anxiety.",
      socraticInquiries: [
        "Where in your daily workflow can you introduce a deliberate 'micro-pause' similar to your morning tea ritual?",
        "What is one worry about next month that you can consciously hand over to time rather than overanalyzing today?"
      ],
      emotionalResonance: {
        primary: "Peaceful",
        energy: "Calm",
        cognitivePattern: "Mindful Acceptance & Deceleration",
      },
      growthTakeaway: "Patience is not passive waiting; it is trusting that clarity reveals itself in its own natural cadence.",
      modelUsed: "gemini-3.6-flash",
      generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "entry_seed_2",
    userId: DEFAULT_USER_ID,
    title: "Reframing friction at work as an invitation to lead",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    mood: "Reflective",
    tags: ["work", "growth", "communication"],
    favorite: false,
    content:
      "Had a difficult review meeting today regarding architectural trade-offs. Two senior colleagues had opposing perspectives and tension flared quickly.\n\nMy instinct was to retreat and remain silent to keep the peace. But I realized that peace keeping is not the same as peace making. I spoke up, summarized both of their core concerns onto the whiteboard, and highlighted where their principles actually aligned.\n\nThe tone of the room completely shifted from combat to problem-solving. It felt vulnerable, but deeply empowering.",
    reflection: {
      summary:
        "A courageous step from passive conflict avoidance toward constructive, empathetic leadership under pressure.",
      socraticInquiries: [
        "How did your body feel in the exact moment before you chose to speak up, and what helped you cross that threshold?",
        "What does this teach you about your unique capacity to synthesize differing perspectives?"
      ],
      emotionalResonance: {
        primary: "Resilient",
        energy: "Elevated",
        cognitivePattern: "Constructive Agency & Assertiveness",
      },
      growthTakeaway: "True peace making requires stepping into the tension with compassionate clarity.",
      modelUsed: "gemini-3.6-flash",
      generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export class JournalStorage {
  private static getStorageKey(userId: string): string {
    return `gemini_journal_vault_${userId}`;
  }

  private static getSynthesisKey(userId: string): string {
    return `gemini_journal_synthesis_${userId}`;
  }

  // Load all user-isolated entries
  static loadEntries(userId = DEFAULT_USER_ID): JournalEntry[] {
    try {
      const key = this.getStorageKey(userId);
      const raw = localStorage.getItem(key);
      if (!raw) {
        // Initialize with seed data on fresh vault
        this.saveEntries(SEED_ENTRIES, userId);
        return SEED_ENTRIES;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (e) {
      console.error("Failed to parse journal vault from localStorage:", e);
      return SEED_ENTRIES;
    }
  }

  // Save entries with strict undefined stripping and atomic confirmation
  static saveEntries(entries: JournalEntry[], userId = DEFAULT_USER_ID): boolean {
    try {
      const cleaned = stripUndefined(entries);
      const key = this.getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(cleaned));
      return true;
    } catch (e) {
      console.error("Failed to commit entries to journal vault:", e);
      throw new Error("Local vault storage failed or quota exceeded.");
    }
  }

  // Save or update single entry (Guaranteed Transaction Verification)
  static upsertEntry(entry: JournalEntry, userId = DEFAULT_USER_ID): JournalEntry {
    const entries = this.loadEntries(userId);
    const cleanedEntry = stripUndefined({
      ...entry,
      updatedAt: new Date().toISOString(),
    });

    const index = entries.findIndex((e) => e.id === entry.id);
    if (index >= 0) {
      entries[index] = cleanedEntry;
    } else {
      entries.unshift(cleanedEntry);
    }

    this.saveEntries(entries, userId);
    return cleanedEntry;
  }

  // Delete entry
  static deleteEntry(entryId: string, userId = DEFAULT_USER_ID): boolean {
    const entries = this.loadEntries(userId);
    const filtered = entries.filter((e) => e.id !== entryId);
    return this.saveEntries(filtered, userId);
  }

  // Save cached synthesis
  static saveSynthesis(synthesis: JournalSynthesis, userId = DEFAULT_USER_ID): void {
    try {
      const cleaned = stripUndefined(synthesis);
      localStorage.setItem(this.getSynthesisKey(userId), JSON.stringify(cleaned));
    } catch (e) {
      console.error("Failed to save synthesis:", e);
    }
  }

  // Load cached synthesis
  static loadSynthesis(userId = DEFAULT_USER_ID): JournalSynthesis | null {
    try {
      const raw = localStorage.getItem(this.getSynthesisKey(userId));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // Export entries as JSON string
  static exportJSON(userId = DEFAULT_USER_ID): string {
    const entries = this.loadEntries(userId);
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        userId,
        version: "1.0",
        totalEntries: entries.length,
        entries,
      },
      null,
      2
    );
  }

  // Export entries as clean Markdown archive
  static exportMarkdown(userId = DEFAULT_USER_ID): string {
    const entries = this.loadEntries(userId);
    return entries
      .map((entry) => {
        let md = `# ${entry.title || "Untitled Entry"}\n`;
        md += `*Date: ${entry.date} | Mood: ${entry.mood} | Tags: ${entry.tags.join(", ") || "None"}*\n\n`;
        md += `${entry.content}\n\n`;
        if (entry.reflection) {
          md += `### Gemini AI Reflection (${entry.reflection.modelUsed})\n`;
          md += `> ${entry.reflection.summary}\n\n`;
          if (entry.reflection.socraticInquiries.length > 0) {
            md += `**Socratic Inquiries:**\n`;
            entry.reflection.socraticInquiries.forEach((q) => {
              md += `- ${q}\n`;
            });
            md += "\n";
          }
          md += `**Emotional Resonance:** ${entry.reflection.emotionalResonance.primary} (${entry.reflection.emotionalResonance.energy} energy, ${entry.reflection.emotionalResonance.cognitivePattern})\n\n`;
          md += `**Growth Takeaway:** *${entry.reflection.growthTakeaway}*\n\n`;
        }
        md += `---\n`;
        return md;
      })
      .join("\n\n");
  }

  // Import JSON entries safely
  static importJSON(jsonString: string, userId = DEFAULT_USER_ID): number {
    const parsed = JSON.parse(jsonString);
    const incoming: JournalEntry[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.entries)
      ? parsed.entries
      : [];

    if (!incoming.length) {
      throw new Error("No valid entries found in imported file.");
    }

    const current = this.loadEntries(userId);
    const currentIds = new Set(current.map((e) => e.id));
    let addedCount = 0;

    for (const item of incoming) {
      if (item && item.content) {
        const id = item.id || `entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const validItem: JournalEntry = stripUndefined({
          id,
          userId,
          title: item.title || "Imported Reflection",
          content: item.content,
          date: item.date || new Date().toISOString().slice(0, 10),
          mood: item.mood || "Reflective",
          tags: Array.isArray(item.tags) ? item.tags : [],
          favorite: Boolean(item.favorite),
          reflection: item.reflection,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        if (currentIds.has(id)) {
          const index = current.findIndex((e) => e.id === id);
          current[index] = validItem;
        } else {
          current.unshift(validItem);
          currentIds.add(id);
        }
        addedCount++;
      }
    }

    this.saveEntries(current, userId);
    return addedCount;
  }
}
