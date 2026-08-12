import { auth } from "./firebase";

export interface ProjectRecord {
  id: string;
  user_id: string;
  name: string;
  initial_prompt: string;
  framework: string;
  status: "creating" | "planning" | "building" | "ready" | "failed" | "archived";
  created_at: string;
  updated_at: string;
}

export interface ProjectFileRecord {
  id: string;
  project_id: string;
  path: string;
  filename: string;
  content: string;
  language: string;
  size: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectChatMessageRecord {
  id: string;
  project_id: string;
  user_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  message_type:
    | "user_prompt"
    | "thinking"
    | "planning"
    | "file_created"
    | "code_generation"
    | "build"
    | "error"
    | "success"
    | "final";
  metadata?: any;
  created_at: string;
}

export interface ProjectEventRecord {
  id: string;
  project_id: string;
  event_type: string;
  payload: any;
  sequence_number: number;
  created_at: string;
}

export interface ProjectBuildRecord {
  id: string;
  project_id: string;
  status: "pending" | "building" | "success" | "failed";
  logs: string;
  preview_url: string;
  created_at: string;
  completed_at: string | null;
}

export interface CreateProjectParams {
  name?: string;
  prompt: string;
  framework?: string;
}

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken().catch(() => null);
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      headers["X-User-Id"] = auth.currentUser.uid;
      if (auth.currentUser.email) {
        headers["X-User-Email"] = auth.currentUser.email;
      }
    } else {
      let localSessionId = localStorage.getItem("nexo_session_user_id");
      if (!localSessionId) {
        localSessionId = `guest_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
        localStorage.setItem("nexo_session_user_id", localSessionId);
      }
      headers["X-User-Id"] = localSessionId;
    }
  } catch (err) {
    console.error("[projectApi] Error resolving auth headers:", err);
  }

  return headers;
};

// ─── Base Project Operations ──────────────────────────────────────────────────

export const createProjectApi = async (params: CreateProjectParams) => {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/projects", {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Failed to create project (${response.status})`);
  }
  return data;
};

export const getProjectApi = async (projectId: string) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: "GET",
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Failed to get project (${response.status})`);
  }
  return data;
};

export const listProjectsApi = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/projects", {
    method: "GET",
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Failed to list projects (${response.status})`);
  }
  return data;
};

// ─── Project Files API ────────────────────────────────────────────────────────

export const getProjectFilesApi = async (projectId: string) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files`, {
    method: "GET",
    headers,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to fetch project files");
  return data;
};

export const saveProjectFileApi = async (
  projectId: string,
  file: { path: string; filename?: string; content: string; language?: string }
) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files`, {
    method: "POST",
    headers,
    body: JSON.stringify(file),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to save project file");
  return data;
};

export const deleteProjectFileApi = async (projectId: string, filePath: string) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files`, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ path: filePath }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to delete project file");
  return data;
};

// ─── Project Chat API ─────────────────────────────────────────────────────────

export const getProjectChatApi = async (projectId: string) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/chat`, {
    method: "GET",
    headers,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to fetch project chat");
  return data;
};

export const addChatMessageApi = async (
  projectId: string,
  message: {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    message_type?: string;
    metadata?: any;
  }
) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify(message),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to add chat message");
  return data;
};

// ─── Project Events API ───────────────────────────────────────────────────────

export const getProjectEventsApi = async (projectId: string) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/events`, {
    method: "GET",
    headers,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to fetch project events");
  return data;
};

export const addProjectEventApi = async (
  projectId: string,
  event: { event_type: string; payload?: any }
) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/events`, {
    method: "POST",
    headers,
    body: JSON.stringify(event),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to add project event");
  return data;
};

// ─── Project Builds API ───────────────────────────────────────────────────────

export const getProjectBuildsApi = async (projectId: string) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/builds`, {
    method: "GET",
    headers,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to fetch project builds");
  return data;
};

export const createProjectBuildApi = async (
  projectId: string,
  build: { status?: string; logs?: string; preview_url?: string }
) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/builds`, {
    method: "POST",
    headers,
    body: JSON.stringify(build),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to create project build");
  return data;
};

export const updateProjectBuildApi = async (
  projectId: string,
  buildId: string,
  updates: { status?: string; logs?: string; preview_url?: string }
) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/builds/${encodeURIComponent(buildId)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(updates),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to update project build");
  return data;
};
