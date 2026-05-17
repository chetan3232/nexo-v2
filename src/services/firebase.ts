import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getDatabase,
  ref,
  set,
  get,
  child,
  remove,
  update,
  serverTimestamp,
} from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getDatabase(app);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out", error);
    throw error;
  }
};

// ─── Chat Persistence ─────────────────────────────────────────────────────────

export interface ChatSaveData {
  id: string;
  name: string;
  date: string;
  updatedAt: number;
  messages: any[];
  content: any | null;
  model?: string;
  projectMode?: string;
  messageCount: number;
  fileCount: number;
}

/**
 * Save a full chat session to Firebase Realtime Database.
 * Path: users/{uid}/chats/{chatId}
 * All messages, generated code files, model used, and metadata are saved.
 */
export const saveChatToFirebase = async (
  uid: string,
  chatData: ChatSaveData,
) => {
  try {
    const chatRef = ref(db, `users/${uid}/chats/${chatData.id}`);
    await set(chatRef, {
      ...chatData,
      updatedAt: Date.now(),
      // Firebase doesn't support undefined values — sanitize
      content: chatData.content
        ? {
            ...chatData.content,
            files: chatData.content.files || {},
          }
        : null,
    });
  } catch (error) {
    console.error("Error saving chat to Firebase:", error);
  }
};

/**
 * Load all chats for a user, sorted by most recently updated.
 */
export const loadChatsFromFirebase = async (
  uid: string,
): Promise<ChatSaveData[]> => {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `users/${uid}/chats`));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return (Object.values(data) as ChatSaveData[]).sort((a, b) => {
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
    }
    return [];
  } catch (error) {
    console.error("Error loading chats from Firebase:", error);
    return [];
  }
};

/**
 * Delete a specific chat from Firebase.
 */
export const deleteChatFromFirebase = async (uid: string, chatId: string) => {
  try {
    const chatRef = ref(db, `users/${uid}/chats/${chatId}`);
    await remove(chatRef);
  } catch (error) {
    console.error("Error deleting chat from Firebase:", error);
  }
};
