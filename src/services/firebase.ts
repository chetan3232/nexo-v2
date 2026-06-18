import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged as fbOnAuthStateChanged,
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
import toast from "react-hot-toast";

const hasFirebaseConfig = !!import.meta.env.VITE_FIREBASE_API_KEY;

const mockAuth = {
  currentUser: null,
  onAuthStateChanged: (callback: any) => {
    callback(null);
    return () => {};
  }
};

let app: any = null;
let auth: any = mockAuth as any;
let provider: any = null;
let db: any = null;

if (hasFirebaseConfig) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
    db = getDatabase(app);
  } catch (err) {
    console.error("Failed to initialize Firebase:", err);
  }
} else {
  console.warn("Firebase configuration is missing! App running in offline local-only fallback mode.");
}

export const onAuthStateChanged = (authInstance: any, callback: (user: any) => void) => {
  if (!authInstance || authInstance === mockAuth) {
    callback(null);
    return () => {};
  }
  return fbOnAuthStateChanged(authInstance, callback);
};

export { auth, provider, db };

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
  title?: string;
  date: string;
  updatedAt: number;
  messages: any[];
  content: any | null;
  model?: string;
  projectMode?: string;
  messageCount: number;
  fileCount: number;
}

const LOCAL_CHATS_KEY = "nexo_local_chats";

/**
 * Save a full chat session to Firebase Realtime Database.
 * Path: users/{uid}/chats/{chatId}
 * All messages, generated code files, model used, and metadata are saved.
 */
export const saveChatToFirebase = async (
  uid: string,
  chatData: ChatSaveData,
) => {
  if (uid === "mock-local-user-id") {
    try {
      const localChats = JSON.parse(localStorage.getItem(LOCAL_CHATS_KEY) || "{}");
      localChats[chatData.id] = {
        ...chatData,
        updatedAt: Date.now(),
        content: chatData.content
          ? {
              ...chatData.content,
              files: chatData.content.files || {},
            }
          : null,
      };
      localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(localChats));
      return;
    } catch (e) {
      console.error("Error saving local chat:", e);
    }
  }

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
  if (uid === "mock-local-user-id") {
    try {
      const localChats = JSON.parse(localStorage.getItem(LOCAL_CHATS_KEY) || "{}");
      return (Object.values(localChats) as ChatSaveData[]).sort((a, b) => {
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
    } catch (e) {
      console.error("Error loading local chats:", e);
      return [];
    }
  }

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
  if (uid === "mock-local-user-id") {
    try {
      const localChats = JSON.parse(localStorage.getItem(LOCAL_CHATS_KEY) || "{}");
      delete localChats[chatId];
      localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(localChats));
      return;
    } catch (e) {
      console.error("Error deleting local chat:", e);
    }
  }

  try {
    const chatRef = ref(db, `users/${uid}/chats/${chatId}`);
    await remove(chatRef);
  } catch (error) {
    console.error("Error deleting chat from Firebase:", error);
  }
};

// ─── Publish ───────────────────────────────────────────────────────────────────

export interface PublishedProject {
  id: string;
  ownerId: string;
  title: string;
  htmlContent: string;   // self-contained HTML bundle
  publishedAt: number;
  viewCount: number;
}

/**
 * Publish project as a self-contained HTML bundle stored in Firebase.
 * Returns a shareable projectId.
 */
export const publishProject = async (
  uid: string,
  title: string,
  files: Record<string, string>,
): Promise<string> => {
  const projectId = crypto.randomUUID();

  // Build self-contained HTML: find index.html or stitch CSS/JS into one file
  let html = files["/index.html"] || files["index.html"] || "";
  if (!html) {
    // Fallback: wrap all JS/TS as a script, CSS as style
    const css = Object.entries(files)
      .filter(([k]) => k.endsWith(".css"))
      .map(([, v]) => v)
      .join("\n");
    const js = Object.entries(files)
      .filter(([k]) => k.endsWith(".js") || k.endsWith(".ts"))
      .map(([, v]) => v)
      .join("\n");
    html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>${js ? `<script>${js}</script>` : ""}</body></html>`;
  }

  const projectRef = ref(db, `published/${projectId}`);
  await set(projectRef, {
    id: projectId,
    ownerId: uid,
    title,
    htmlContent: html,
    publishedAt: Date.now(),
    viewCount: 0,
  });
  return projectId;
};

export const getPublishedProject = async (
  projectId: string,
): Promise<PublishedProject | null> => {
  try {
    const snap = await get(ref(db, `published/${projectId}`));
    return snap.exists() ? (snap.val() as PublishedProject) : null;
  } catch {
    return null;
  }
};

// ─── Share ─────────────────────────────────────────────────────────────────────

export type SharePermission = "read" | "write";

export interface SharedProject {
  id: string;
  ownerId: string;
  chatId: string;
  title: string;
  permission: SharePermission;
  botRestrictions: string;  // comma-separated topics the bot cannot change
  messages: any[];
  content: any | null;
  createdAt: number;
  ownerName: string;
}

/**
 * Create a share link for the current project stored in Firebase.
 * Returns the shareId to construct: /s/{shareId}
 */
export const shareProject = async ({
  uid,
  chatId,
  title,
  permission,
  botRestrictions,
  messages,
  content,
  ownerName,
}: {
  uid: string;
  chatId: string;
  title: string;
  permission: SharePermission;
  botRestrictions: string;
  messages: any[];
  content: any | null;
  ownerName: string;
}): Promise<string> => {
  const shareId = crypto.randomUUID();
  if (!db) {
    toast.error("Sharing is unavailable in offline mode.");
    throw new Error("Database not initialized");
  }
  const shareRef = ref(db, `shares/${shareId}`);
  await set(shareRef, {
    id: shareId,
    ownerId: uid,
    chatId,
    title,
    permission,
    botRestrictions,
    messages,
    content: content ? { ...content, files: content.files || {} } : null,
    createdAt: Date.now(),
    ownerName,
  });
  return shareId;
};

export const getSharedProject = async (
  shareId: string,
): Promise<SharedProject | null> => {
  try {
    const snap = await get(ref(db, `shares/${shareId}`));
    return snap.exists() ? (snap.val() as SharedProject) : null;
  } catch {
    return null;
  }
};

// ─── Remix ─────────────────────────────────────────────────────────────────────

/**
 * Fork a shared project into the current user's chat history.
 * Returns the new chatId.
 */
export const remixProject = async (
  uid: string,
  shared: SharedProject | ChatSaveData,
  remixerName: string,
): Promise<string> => {
  const newChatId = crypto.randomUUID();
  if (!db) {
    throw new Error("Database not initialized");
  }
  const title = `${(shared as any).title || "Project"} (Remix)`;
  const chatRef = ref(db, `users/${uid}/chats/${newChatId}`);
  await set(chatRef, {
    id: newChatId,
    name: title,
    title,
    date: new Date().toLocaleDateString(),
    updatedAt: Date.now(),
    messages: (shared as any).messages || [],
    content: (shared as any).content || null,
    messageCount: ((shared as any).messages || []).length,
    fileCount: Object.keys((shared as any).content?.files || {}).length,
    remixedFrom: (shared as any).id || null,
    remixedBy: remixerName,
  });
  return newChatId;
};
