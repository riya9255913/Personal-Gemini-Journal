export interface EmotionalResonance {
  primary: string;
  energy: string; // "Calm", "Elevated", "Subdued", "Restless"
  cognitivePattern: string; // e.g. "Growth Mindset", "Catastrophizing", "Self-Compassion", "Gratitude"
}

export interface JournalReflection {
  summary: string;
  socraticInquiries: string[];
  emotionalResonance: EmotionalResonance;
  growthTakeaway: string;
  modelUsed: string;
  generatedAt: string;
}

export interface JournalChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  mood: string;
  tags: string[];
  favorite: boolean;
  reflection?: JournalReflection;
  messages?: JournalChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalSynthesis {
  period: string;
  coreThemes: string[];
  moodTrajectory: string;
  growthMoments: string[];
  encouragingNote: string;
  modelUsed: string;
  generatedAt: string;
}

export interface PromptSuggestion {
  category: string;
  prompt: string;
  intent: string;
}

export interface ModelHealthInfo {
  status: 'operational' | 'degraded' | 'unavailable';
  primaryModel: string;
  ladder: string[];
  lastUsedModel?: string;
  apiKeyConfigured: boolean;
}
