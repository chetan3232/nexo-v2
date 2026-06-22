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
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
} from "firebase/firestore";
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
let firestore: any = null;

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
    try {
      firestore = getFirestore(app);
    } catch (fsErr) {
      console.error("Failed to initialize Firestore:", fsErr);
    }
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
  if (uid === "mock-local-user-id" || !firestore) {
    try {
      const localChats = JSON.parse(localStorage.getItem(LOCAL_CHATS_KEY) || "{}");
      const metaData = { ...chatData, content: null };
      localChats[chatData.id] = {
        ...metaData,
        updatedAt: Date.now()
      };
      localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(localChats));

      if (chatData.content && chatData.content.files) {
        const filesMap: Record<string, any> = {};
        for (const [path, content] of Object.entries(chatData.content.files)) {
          const encodedPath = encodeURIComponent(path);
          filesMap[encodedPath] = {
            path,
            content,
            language: path.endsWith('.tsx') || path.endsWith('.ts') ? 'typescript' : path.endsWith('.html') ? 'html' : path.endsWith('.css') ? 'css' : 'javascript',
            updatedAt: Date.now()
          };
        }
        localStorage.setItem(`nexo_local_chat_files_${chatData.id}`, JSON.stringify(filesMap));
      }
      
      // If db is available, also save metadata to RTDB for compatibility
      if (db && uid !== "mock-local-user-id") {
        const chatRef = ref(db, `users/${uid}/chats/${chatData.id}`);
        await set(chatRef, { ...metaData, updatedAt: Date.now() });
      }
      return;
    } catch (e) {
      console.error("Error saving local chat:", e);
    }
  }

  try {
    // Save to Firestore
    const chatDocRef = doc(firestore, `chats/${chatData.id}`);
    const metaData = {
      ...chatData,
      content: null,
      uid,
      updatedAt: Date.now()
    };
    await setDoc(chatDocRef, metaData);

    if (chatData.content && chatData.content.files) {
      const filesColRef = collection(firestore, `chats/${chatData.id}/files`);
      
      for (const [path, content] of Object.entries(chatData.content.files)) {
        const encodedPath = encodeURIComponent(path);
        const fileDocRef = doc(firestore, `chats/${chatData.id}/files/${encodedPath}`);
        await setDoc(fileDocRef, {
          path,
          content,
          language: path.endsWith('.tsx') || path.endsWith('.ts') ? 'typescript' : path.endsWith('.html') ? 'html' : path.endsWith('.css') ? 'css' : 'javascript',
          updatedAt: Date.now()
        });
      }

      // Cleanup deleted files
      const filesSnap = await getDocs(filesColRef);
      const currentPaths = new Set(Object.keys(chatData.content.files));
      for (const fileDoc of filesSnap.docs) {
        const docId = fileDoc.id;
        const decodedPath = decodeURIComponent(docId);
        if (!currentPaths.has(decodedPath)) {
          await deleteDoc(doc(firestore, `chats/${chatData.id}/files/${docId}`));
        }
      }
    }
  } catch (error) {
    console.error("Error saving chat to Firestore:", error);
    // Realtime Database Fallback
    if (db) {
      try {
        const chatRef = ref(db, `users/${uid}/chats/${chatData.id}`);
        await set(chatRef, {
          ...chatData,
          updatedAt: Date.now(),
          content: chatData.content ? { ...chatData.content, files: chatData.content.files || {} } : null,
        });
      } catch (rtdbErr) {
        console.error("RTDB Save fallback failed:", rtdbErr);
      }
    }
  }
};

/**
 * Load all chats for a user, sorted by most recently updated.
 */
export const loadChatsFromFirebase = async (
  uid: string,
): Promise<ChatSaveData[]> => {
  if (uid === "mock-local-user-id" || !firestore) {
    try {
      const localChats = JSON.parse(localStorage.getItem(LOCAL_CHATS_KEY) || "{}");
      const list = Object.values(localChats) as ChatSaveData[];
      for (const chat of list) {
        const filesMapStr = localStorage.getItem(`nexo_local_chat_files_${chat.id}`);
        if (filesMapStr) {
          const filesMap = JSON.parse(filesMapStr);
          const files: Record<string, string> = {};
          for (const fileDoc of Object.values(filesMap) as any[]) {
            files[fileDoc.path] = fileDoc.content;
          }
          chat.content = {
            files,
            patches: {},
            mainFile: "index.html",
            template: "web"
          };
        }
      }
      return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } catch (e) {
      console.error("Error loading local chats:", e);
      return [];
    }
  }

  try {
    const chatsColRef = collection(firestore, "chats");
    const q = query(chatsColRef, where("uid", "==", uid));
    const qSnap = await getDocs(q);
    
    const chats: ChatSaveData[] = [];
    for (const chatDoc of qSnap.docs) {
      const chatData = chatDoc.data() as ChatSaveData;
      
      const filesColRef = collection(firestore, `chats/${chatData.id}/files`);
      const filesSnap = await getDocs(filesColRef);
      
      const files: Record<string, string> = {};
      filesSnap.forEach((fileDoc) => {
        const fileData = fileDoc.data();
        if (fileData.path && fileData.content !== undefined) {
          files[fileData.path] = fileData.content;
        }
      });

      chatData.content = {
        files,
        patches: {},
        mainFile: "index.html",
        template: "web"
      };
      chats.push(chatData);
    }
    return chats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (error) {
    console.error("Error loading chats from Firestore:", error);
    // Realtime Database Fallback
    if (db) {
      try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, `users/${uid}/chats`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          return (Object.values(data) as ChatSaveData[]).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        }
      } catch (rtdbErr) {
        console.error("RTDB Load fallback failed:", rtdbErr);
      }
    }
    return [];
  }
};

/**
 * Delete a specific chat from Firebase.
 */
export const deleteChatFromFirebase = async (uid: string, chatId: string) => {
  if (uid === "mock-local-user-id" || !firestore) {
    try {
      const localChats = JSON.parse(localStorage.getItem(LOCAL_CHATS_KEY) || "{}");
      delete localChats[chatId];
      localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(localChats));
      localStorage.removeItem(`nexo_local_chat_files_${chatId}`);
      
      if (db && uid !== "mock-local-user-id") {
        const chatRef = ref(db, `users/${uid}/chats/${chatId}`);
        await remove(chatRef);
      }
      return;
    } catch (e) {
      console.error("Error deleting local chat:", e);
    }
  }

  try {
    const chatDocRef = doc(firestore, `chats/${chatId}`);
    await deleteDoc(chatDocRef);

    // Delete subcollection files
    const filesColRef = collection(firestore, `chats/${chatId}/files`);
    const filesSnap = await getDocs(filesColRef);
    for (const fileDoc of filesSnap.docs) {
      await deleteDoc(doc(firestore, `chats/${chatId}/files/${fileDoc.id}`));
    }
  } catch (error) {
    console.error("Error deleting chat from Firestore:", error);
    if (db) {
      try {
        const chatRef = ref(db, `users/${uid}/chats/${chatId}`);
        await remove(chatRef);
      } catch (rtdbErr) {
        console.error("RTDB Delete fallback failed:", rtdbErr);
      }
    }
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

/**
 * Load a single chat by its ID from Firestore or LocalStorage.
 */
export const loadSingleChatFromFirebaseOrLocal = async (
  uid: string,
  chatId: string
): Promise<ChatSaveData | null> => {
  if (uid === "mock-local-user-id" || !firestore) {
    try {
      const localChats = JSON.parse(localStorage.getItem(LOCAL_CHATS_KEY) || "{}");
      const chat = localChats[chatId] as ChatSaveData;
      if (!chat) return null;
      
      const filesMapStr = localStorage.getItem(`nexo_local_chat_files_${chatId}`);
      if (filesMapStr) {
        const filesMap = JSON.parse(filesMapStr);
        const files: Record<string, string> = {};
        for (const fileDoc of Object.values(filesMap) as any[]) {
          files[fileDoc.path] = fileDoc.content;
        }
        chat.content = {
          files,
          patches: {},
          mainFile: "index.html",
          template: "web"
        };
      }
      return chat;
    } catch (e) {
      console.error("Error loading local chat:", e);
      return null;
    }
  }

  try {
    const chatDocRef = doc(firestore, `chats/${chatId}`);
    const chatDoc = await getDoc(chatDocRef);
    if (chatDoc.exists()) {
      const chatData = chatDoc.data() as ChatSaveData;
      
      const filesColRef = collection(firestore, `chats/${chatId}/files`);
      const filesSnap = await getDocs(filesColRef);
      
      const files: Record<string, string> = {};
      filesSnap.forEach((fileDoc) => {
        const fileData = fileDoc.data();
        if (fileData.path && fileData.content !== undefined) {
          files[fileData.path] = fileData.content;
        }
      });

      chatData.content = {
        files,
        patches: {},
        mainFile: "index.html",
        template: "web"
      };
      return chatData;
    }
  } catch (error) {
    console.error("Error loading chat from Firestore:", error);
  }

  // Fallback to RTDB
  if (db) {
    try {
      const chatRef = ref(db, `users/${uid}/chats/${chatId}`);
      const snapshot = await get(chatRef);
      if (snapshot.exists()) {
        return snapshot.val() as ChatSaveData;
      }
    } catch (rtdbErr) {
      console.error("RTDB Load fallback failed:", rtdbErr);
    }
  }
  return null;
};
