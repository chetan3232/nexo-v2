import { initializeApp } from "firebase/app";
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
const nativeAuth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getDatabase(app);

// Mock Auth Fallback System
let mockUser: any = null;
const authListeners = new Set<(user: any) => void>();

try {
  const saved = localStorage.getItem("nexo_mock_user");
  if (saved) {
    mockUser = JSON.parse(saved);
  }
} catch (e) {
  console.error("Failed to parse saved mock user", e);
}

// Proxied Auth Object
export const auth = new Proxy(nativeAuth, {
  get(target, prop, receiver) {
    if (prop === "currentUser") {
      return mockUser || target.currentUser;
    }
    if (prop === "onAuthStateChanged") {
      return (callback: (user: any) => void) => {
        authListeners.add(callback);
        // Call immediately with active user
        if (mockUser) {
          callback(mockUser);
        } else {
          callback(target.currentUser);
        }
        return () => {
          authListeners.delete(callback);
        };
      };
    }
    return Reflect.get(target, prop, receiver);
  }
});

// Custom exported onAuthStateChanged
export const onAuthStateChanged = (authInstance: any, callback: (user: any) => void) => {
  authListeners.add(callback);
  
  // Also hook into native Firebase auth changes
  const unsubscribeNative = fbOnAuthStateChanged(nativeAuth, (fbUser) => {
    if (!mockUser) {
      callback(fbUser);
    }
  });

  if (mockUser) {
    callback(mockUser);
  } else {
    callback(nativeAuth.currentUser);
  }

  return () => {
    authListeners.delete(callback);
    unsubscribeNative();
  };
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(nativeAuth, provider);
    mockUser = null;
    localStorage.removeItem("nexo_mock_user");
    authListeners.forEach((cb) => cb(result.user));
    return result.user;
  } catch (error) {
    console.warn("Firebase Google Sign-In failed, falling back to local mock user:", error);
    
    // Create local mock user
    const localUser = {
      uid: "mock-local-user-id",
      displayName: "Local Developer",
      email: "local-developer@nexo.ai",
      photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150",
      providerId: "google.com",
    };
    
    mockUser = localUser;
    localStorage.setItem("nexo_mock_user", JSON.stringify(localUser));
    
    // Notify all listeners
    authListeners.forEach((cb) => cb(localUser));
    
    toast.success("Signed in with local developer account!");
    return localUser as any;
  }
};

export const logout = async () => {
  try {
    mockUser = null;
    localStorage.removeItem("nexo_mock_user");
    await signOut(nativeAuth);
    authListeners.forEach((cb) => cb(null));
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
