import {
  db,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
} from "./firebase";
import { JournalEntry, JournalChatMessage } from "../types";
import { stripUndefined, JournalStorage } from "./storage";

export interface UserInteractionRecord {
  id: string;
  userId: string;
  entryId: string;
  type: "reflection" | "chat" | "prompt_generation" | "synthesis";
  prompt: string;
  response: string;
  modelUsed: string;
  createdAt: string;
}

export class FirestoreJournalService {
  /**
   * Subscribes to real-time entries collection for the authenticated user.
   * Path: /users/{userId}/entries/{entryId}
   */
  static subscribeToEntries(
    userId: string,
    onSuccess: (entries: JournalEntry[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    if (!userId) {
      onSuccess([]);
      return () => {};
    }

    try {
      const entriesRef = collection(db, "users", userId, "entries");
      const q = query(entriesRef, orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const entries: JournalEntry[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as JournalEntry;
            entries.push({
              ...data,
              id: docSnap.id,
            });
          });
          onSuccess(entries);
        },
        (error) => {
          console.warn("[Firestore subscription error]:", error);
          if (onError) onError(error);
          // Graceful fallback to local vault
          const fallback = JournalStorage.loadEntries(userId);
          onSuccess(fallback);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.warn("[Firestore subscribe failed to initialize]:", err);
      const fallback = JournalStorage.loadEntries(userId);
      onSuccess(fallback);
      return () => {};
    }
  }

  /**
   * Persists or updates a JournalEntry in Firestore.
   * Also backs up into local storage as an offline fallback.
   */
  static async saveEntry(userId: string, entry: JournalEntry): Promise<JournalEntry> {
    const cleaned = stripUndefined({
      ...entry,
      userId,
      updatedAt: new Date().toISOString(),
    });

    // 1. Local vault sync (Zero data loss guarantee)
    JournalStorage.upsertEntry(cleaned, userId);

    // 2. Cloud Firestore commit with owner-isolated path
    try {
      const docRef = doc(db, "users", userId, "entries", cleaned.id);
      await setDoc(docRef, cleaned, { merge: true });
    } catch (err) {
      console.warn("[Firestore saveEntry error, saved locally]:", err);
      // Notice: we do not rethrow if local save succeeded, but log it
    }

    return cleaned;
  }

  /**
   * Appends a multi-turn chat message to an existing entry
   */
  static async appendChatMessage(
    userId: string,
    entry: JournalEntry,
    message: JournalChatMessage
  ): Promise<JournalEntry> {
    const updatedMessages = [...(entry.messages || []), message];
    const updatedEntry: JournalEntry = {
      ...entry,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    return await this.saveEntry(userId, updatedEntry);
  }

  /**
   * Deletes a journal entry from Firestore and local storage
   */
  static async deleteEntry(userId: string, entryId: string): Promise<void> {
    JournalStorage.deleteEntry(entryId, userId);

    try {
      const docRef = doc(db, "users", userId, "entries", entryId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("[Firestore deleteEntry error]:", err);
    }
  }

  /**
   * Saves an interaction (prompt + response audit record) to /users/{userId}/interactions
   */
  static async recordInteraction(
    userId: string,
    interaction: Omit<UserInteractionRecord, "id" | "userId" | "createdAt">
  ): Promise<void> {
    try {
      const interactionId = `int_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const record: UserInteractionRecord = stripUndefined({
        ...interaction,
        id: interactionId,
        userId,
        createdAt: new Date().toISOString(),
      });

      const docRef = doc(db, "users", userId, "interactions", interactionId);
      await setDoc(docRef, record);
    } catch (err) {
      console.warn("[Firestore recordInteraction error]:", err);
    }
  }
}
