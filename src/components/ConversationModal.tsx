import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Sparkles,
  Send,
  X,
  User,
  Bot,
  RefreshCw,
  Lightbulb,
  AlertCircle,
  Clock,
} from "lucide-react";
import { JournalEntry, JournalChatMessage } from "../types";
import { JournalApi } from "../services/api";
import { FirestoreJournalService } from "../services/firestoreStorage";

interface ConversationModalProps {
  entry: JournalEntry;
  userId: string;
  onClose: () => void;
  onEntryUpdated: (updatedEntry: JournalEntry) => void;
}

const QUICK_STARTERS = [
  "Help me brainstorm 3 practical solutions for this.",
  "Offer a compassionate stoic reframe of this situation.",
  "Why might I be feeling this underlying friction?",
  "What question should I ask myself before tomorrow?",
];

export const ConversationModal: React.FC<ConversationModalProps> = ({
  entry,
  userId,
  onClose,
  onEntryUpdated,
}) => {
  const [messages, setMessages] = useState<JournalChatMessage[]>(entry.messages || []);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText.trim();
    if (!textToSend || isSending) return;

    setError(null);
    setInputText("");

    const userMessage: JournalChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    // Optimistically update local message list
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsSending(true);

    try {
      // 1. Call server-side Gemini API with fallback ladder
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await JournalApi.sendChatMessage({
        entryTitle: entry.title,
        entryContent: entry.content,
        userMessage: textToSend,
        history: historyPayload,
      });

      const modelMessage: JournalChatMessage = {
        id: `msg_${Date.now()}_m`,
        role: "model",
        content: res.reply,
        timestamp: res.timestamp,
        modelUsed: res.modelUsed,
      };

      const finalMessages = [...updatedMessages, modelMessage];
      setMessages(finalMessages);

      // 2. Persist to Firestore: update entry document
      const updatedEntry: JournalEntry = {
        ...entry,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
      };
      await FirestoreJournalService.saveEntry(userId, updatedEntry);
      onEntryUpdated(updatedEntry);

      // 3. Record interaction in /users/{userId}/interactions
      await FirestoreJournalService.recordInteraction(userId, {
        entryId: entry.id,
        type: "chat",
        prompt: textToSend,
        response: res.reply,
        modelUsed: res.modelUsed,
      });
    } catch (err: any) {
      console.error("Failed to send chat message:", err);
      setError(err?.message || "Gemini conversation encountered an issue.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xl max-w-3xl w-full h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-800 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-semibold text-stone-900 line-clamp-1">
                  Dialogue with Gemini
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Firestore Logged
                </span>
              </div>
              <p className="text-xs text-stone-500 line-clamp-1">
                Reflection: "{entry.title || "Untitled"}" ({entry.date})
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

        {/* Entry Context Ribbon */}
        <div className="px-6 py-2.5 bg-amber-50/40 border-b border-amber-200/50 flex items-center justify-between text-xs text-amber-900">
          <span className="font-serif italic line-clamp-1">
            "{entry.content.slice(0, 120)}..."
          </span>
          <span className="shrink-0 text-amber-800 font-medium ml-2">
            Mood: {entry.mood}
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#FCFAF7]/50">
          {messages.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-lg font-medium text-stone-800 mb-1">
                Converse about this reflection
              </h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto mb-6">
                Ask Gemini for deeper insights, practical brainstorming, alternative viewpoints, or compassionate clarity.
              </p>

              {/* Starters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto text-left">
                {QUICK_STARTERS.map((starter, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(starter)}
                    className="p-3 rounded-xl bg-white border border-stone-200/80 hover:border-amber-400 text-xs font-serif text-stone-700 hover:text-stone-900 transition-all shadow-2xs text-left"
                  >
                    "{starter}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm font-serif leading-relaxed ${
                      isUser
                        ? "bg-stone-900 text-white rounded-tr-xs"
                        : "bg-white text-stone-800 border border-stone-200/80 rounded-tl-xs shadow-2xs"
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.content}</div>

                    <div
                      className={`mt-2 flex items-center gap-2 text-[10px] ${
                        isUser ? "text-stone-400 justify-end" : "text-stone-400 justify-start"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.modelUsed && (
                        <span className="font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                          {msg.modelUsed}
                        </span>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-amber-700 animate-spin" />
              </div>
              <div className="bg-white text-stone-500 border border-stone-200/80 rounded-2xl rounded-tl-xs p-3.5 text-xs font-serif shadow-2xs flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Gemini is contemplating your thoughts...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-stone-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask Gemini to unpack feelings, brainstorm, or explore further..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSending}
              className="flex-1 px-4 py-3 rounded-xl border border-stone-200 text-xs sm:text-sm font-serif placeholder:text-stone-400 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="p-3 rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition-colors disabled:opacity-50 shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
