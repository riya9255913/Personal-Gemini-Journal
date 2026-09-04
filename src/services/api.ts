import { JournalReflection, JournalSynthesis, PromptSuggestion, ModelHealthInfo } from "../types";

export class JournalApi {
  static async checkHealth(): Promise<ModelHealthInfo> {
    try {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error(`Healthcheck returned HTTP ${res.status}`);
      const data = await res.json();
      return {
        status: "operational",
        primaryModel: data.primaryModel || "gemini-3.6-flash",
        ladder: data.fallbackLadder || ["gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.7-flash"],
        apiKeyConfigured: Boolean(data.apiKeyConfigured),
      };
    } catch (err) {
      console.warn("API health check failed:", err);
      return {
        status: "degraded",
        primaryModel: "gemini-3.6-flash",
        ladder: ["gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.7-flash"],
        apiKeyConfigured: true,
      };
    }
  }

  static async generateReflection(params: {
    title: string;
    content: string;
    mood: string;
    date: string;
  }): Promise<JournalReflection> {
    const res = await fetch("/api/journal/reflect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Network response error" }));
      throw new Error(errorData.details || errorData.error || `Failed with status ${res.status}`);
    }

    return await res.json();
  }

  static async generatePrompts(params: {
    currentDraft?: string;
    preferredMood?: string;
  }): Promise<{ prompts: PromptSuggestion[]; modelUsed: string }> {
    const res = await fetch("/api/journal/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Failed to generate prompts" }));
      throw new Error(errorData.details || errorData.error || `HTTP ${res.status}`);
    }

    return await res.json();
  }

  static async synthesizeEntries(entries: Array<{
    date: string;
    mood: string;
    title: string;
    content: string;
  }>): Promise<JournalSynthesis> {
    const res = await fetch("/api/journal/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Synthesis failed" }));
      throw new Error(errorData.details || errorData.error || `HTTP ${res.status}`);
    }

    return await res.json();
  }

  static async sendChatMessage(params: {
    entryTitle: string;
    entryContent: string;
    userMessage: string;
    history: Array<{ role: "user" | "model"; content: string }>;
  }): Promise<{ reply: string; modelUsed: string; timestamp: string }> {
    const res = await fetch("/api/journal/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Chat failed" }));
      throw new Error(errorData.details || errorData.error || `HTTP ${res.status}`);
    }

    return await res.json();
  }
}
