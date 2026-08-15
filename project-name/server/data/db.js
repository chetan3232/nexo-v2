const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_FILE = path.join(__dirname, 'nexo_db.json');

const VALID_STATUSES = ['creating', 'planning', 'building', 'ready', 'failed', 'archived'];
const VALID_ROLES = ['user', 'assistant', 'system', 'tool'];
const VALID_MESSAGE_TYPES = [
  'user_prompt',
  'thinking',
  'planning',
  'file_created',
  'code_generation',
  'build',
  'error',
  'success',
  'final'
];

let dbData = {
  projects: {},              // map of project_id -> project object
  project_files: {},         // map of project_id -> map of path -> file object
  project_chat_messages: {}, // map of project_id -> array of message objects
  project_events: {},        // map of project_id -> array of event objects
  project_builds: {},        // map of project_id -> map of build_id -> build object
  project_settings: {},      // map of project_id -> settings object
  project_active_jobs: {},   // map of project_id -> active job object
  project_audit_logs: {},    // map of project_id -> array of audit log objects
  project_jobs: {}           // map of project_id -> map of job_id -> job object
};

const initDb = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        dbData.projects = parsed.projects || {};
        dbData.project_files = parsed.project_files || {};
        dbData.project_chat_messages = parsed.project_chat_messages || {};
        dbData.project_events = parsed.project_events || {};
        dbData.project_builds = parsed.project_builds || {};
        dbData.project_settings = parsed.project_settings || {};
        dbData.project_active_jobs = parsed.project_active_jobs || {};
        dbData.project_audit_logs = parsed.project_audit_logs || {};
        dbData.project_jobs = parsed.project_jobs || {};
      }
    } else {
      saveDb();
    }
  } catch (err) {
    console.error('[DB] Error initializing database file:', err);
    dbData = {
      projects: {},
      project_files: {},
      project_chat_messages: {},
      project_events: {},
      project_builds: {}
    };
  }
};

const saveDb = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Error saving database file:', err);
  }
};

// ─── Project Base Operations ───────────────────────────────────────────────────

const createProject = ({ userId, name, initialPrompt, framework = 'react' }) => {
  if (!userId) {
    throw new Error('user_id is required');
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  const formattedFramework = (framework || 'react').toLowerCase();
  const projectName = (name && name.trim()) ? name.trim() : (initialPrompt ? initialPrompt.slice(0, 30).trim() + '...' : 'Untitled Project');

  const projectRecord = {
    id,
    user_id: userId,
    name: projectName,
    initial_prompt: initialPrompt || '',
    framework: formattedFramework,
    status: 'creating',
    created_at: now,
    updated_at: now
  };

  dbData.projects[id] = projectRecord;
  saveDb();

  return projectRecord;
};

const getProjectByIdAndUserId = (projectId, userId) => {
  if (!projectId || !userId) return null;
  const project = dbData.projects[projectId];
  if (!project) return null;

  // Security Enforcement: projects.user_id = authenticated_user.id
  if (project.user_id !== userId) {
    return null;
  }

  return project;
};

const getProjectsByUserId = (userId) => {
  if (!userId) return [];
  const projects = Object.values(dbData.projects)
    .filter((p) => p.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return projects;
};

const updateProjectStatus = (projectId, userId, newStatus) => {
  if (!VALID_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) return null;

  project.status = newStatus;
  project.updated_at = new Date().toISOString();
  saveDb();

  return project;
};

// ─── Project Files Storage Logic ──────────────────────────────────────────────

/**
 * Creates a file in project_files. Enforces unique constraint: project_id + path
 */
const createProjectFile = ({ projectId, userId, path: filePath, filename, content = '', language = 'javascript' }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  if (!filePath) throw new Error('File path is required');

  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  const derivedFilename = filename || path.basename(normalizedPath);
  const now = new Date().toISOString();
  const fileContent = content || '';
  const size = Buffer.byteLength(fileContent, 'utf8');

  if (!dbData.project_files[projectId]) {
    dbData.project_files[projectId] = {};
  }

  // Check unique constraint (project_id + path)
  if (dbData.project_files[projectId][normalizedPath]) {
    return updateProjectFile({ projectId, userId, path: normalizedPath, content, language, filename: derivedFilename });
  }

  const fileRecord = {
    id: uuidv4(),
    project_id: projectId,
    path: normalizedPath,
    filename: derivedFilename,
    content: fileContent,
    language: language || 'javascript',
    size,
    created_at: now,
    updated_at: now
  };

  dbData.project_files[projectId][normalizedPath] = fileRecord;
  saveDb();

  return fileRecord;
};

/**
 * Updates a file in project_files
 */
const updateProjectFile = ({ projectId, userId, path: filePath, content, language, filename }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;

  if (!dbData.project_files[projectId] || !dbData.project_files[projectId][normalizedPath]) {
    // If file doesn't exist yet, auto-create it
    return createProjectFile({ projectId, userId, path: normalizedPath, filename, content, language });
  }

  const fileRecord = dbData.project_files[projectId][normalizedPath];
  const now = new Date().toISOString();

  if (content !== undefined) {
    fileRecord.content = content;
    fileRecord.size = Buffer.byteLength(content, 'utf8');
  }
  if (language) fileRecord.language = language;
  if (filename) fileRecord.filename = filename;
  fileRecord.updated_at = now;

  saveDb();
  return fileRecord;
};

/**
 * Deletes a file from project_files
 */
const deleteProjectFile = ({ projectId, userId, path: filePath }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;

  if (dbData.project_files[projectId] && dbData.project_files[projectId][normalizedPath]) {
    delete dbData.project_files[projectId][normalizedPath];
    saveDb();
    return true;
  }
  return false;
};

/**
 * Gets all project files scoped by project_id and authenticated ownership
 */
const getProjectFiles = ({ projectId, userId }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  const filesMap = dbData.project_files[projectId] || {};
  return Object.values(filesMap).sort((a, b) => a.path.localeCompare(b.path));
};

// ─── Project Chat Messages Logic ─────────────────────────────────────────────

const createChatMessage = ({ projectId, userId, role = 'user', content = '', messageType = 'user_prompt', metadata = {} }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  const formattedRole = VALID_ROLES.includes(role) ? role : 'user';
  const formattedType = VALID_MESSAGE_TYPES.includes(messageType) ? messageType : 'user_prompt';

  const messageRecord = {
    id: uuidv4(),
    project_id: projectId,
    user_id: userId,
    role: formattedRole,
    content: content || '',
    message_type: formattedType,
    metadata: metadata || {},
    created_at: new Date().toISOString()
  };

  if (!dbData.project_chat_messages[projectId]) {
    dbData.project_chat_messages[projectId] = [];
  }

  dbData.project_chat_messages[projectId].push(messageRecord);
  saveDb();

  return messageRecord;
};

const getProjectChat = ({ projectId, userId, limit = 50, before = null }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  const allMessages = dbData.project_chat_messages[projectId] || [];
  const parsedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 50, 200));

  let filteredMessages = allMessages;

  if (before) {
    const beforeIndex = allMessages.findIndex((m) => m.id === before);
    if (beforeIndex !== -1) {
      filteredMessages = allMessages.slice(0, beforeIndex);
    }
  }

  const totalCount = allMessages.length;
  const startIndex = Math.max(0, filteredMessages.length - parsedLimit);
  const pageMessages = filteredMessages.slice(startIndex);
  const hasMore = startIndex > 0;
  const nextCursor = hasMore && pageMessages.length > 0 ? pageMessages[0].id : null;

  return {
    messages: pageMessages,
    total_count: totalCount,
    has_more: hasMore,
    next_cursor: nextCursor
  };
};

// ─── Project Events Logic ────────────────────────────────────────────────────

const createProjectEvent = ({ projectId, userId, eventType, payload = {} }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  if (!dbData.project_events[projectId]) {
    dbData.project_events[projectId] = [];
  }

  const sequenceNumber = dbData.project_events[projectId].length + 1;
  const eventRecord = {
    id: uuidv4(),
    project_id: projectId,
    event_type: eventType || 'GENERIC_EVENT',
    payload: payload || {},
    sequence_number: sequenceNumber,
    created_at: new Date().toISOString()
  };

  dbData.project_events[projectId].push(eventRecord);
  saveDb();

  return eventRecord;
};

const getProjectEvents = ({ projectId, userId, sinceSequence = null }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  const allEvents = dbData.project_events[projectId] || [];

  if (sinceSequence !== null && sinceSequence !== undefined) {
    const seqNum = parseInt(sinceSequence, 10);
    if (!isNaN(seqNum)) {
      return allEvents.filter((e) => e.sequence_number > seqNum);
    }
  }

  return allEvents;
};

// ─── Project Jobs Storage Logic ───────────────────────────────────────────────

const VALID_JOB_STATUSES = ['queued', 'running', 'paused', 'completed', 'failed', 'cancelled'];

const createJob = ({ projectId, userId, type = 'code_generation', payload = {} }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  const jobId = uuidv4();
  const now = new Date().toISOString();

  const jobRecord = {
    id: jobId,
    project_id: projectId,
    user_id: userId,
    type: type || 'code_generation',
    status: 'queued',
    payload: payload || {},
    attempts: 0,
    created_at: now,
    started_at: null,
    completed_at: null,
    error: null,
    final_state: null
  };

  if (!dbData.project_jobs[projectId]) {
    dbData.project_jobs[projectId] = {};
  }

  dbData.project_jobs[projectId][jobId] = jobRecord;
  saveDb();

  return jobRecord;
};

const updateJob = ({
  jobId,
  projectId,
  userId,
  status,
  payload,
  attempts,
  error,
  startedAt,
  completedAt,
  finalState
}) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  if (!dbData.project_jobs[projectId] || !dbData.project_jobs[projectId][jobId]) {
    throw new Error('Job record not found');
  }

  const jobRecord = dbData.project_jobs[projectId][jobId];

  if (status && VALID_JOB_STATUSES.includes(status)) {
    jobRecord.status = status;
    if (status === 'running' && !jobRecord.started_at) {
      jobRecord.started_at = startedAt || new Date().toISOString();
    }
    if ((status === 'completed' || status === 'failed' || status === 'cancelled') && !jobRecord.completed_at) {
      jobRecord.completed_at = completedAt || new Date().toISOString();
    }
  }

  if (payload !== undefined) jobRecord.payload = payload;
  if (attempts !== undefined) jobRecord.attempts = attempts;
  if (error !== undefined) jobRecord.error = error;
  if (finalState !== undefined) jobRecord.final_state = finalState;

  saveDb();
  return jobRecord;
};

const getJobByIdAndUserId = (jobId, projectId, userId) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  if (!dbData.project_jobs[projectId]) return null;
  return dbData.project_jobs[projectId][jobId] || null;
};

const getActiveJobsForProject = ({ projectId, userId }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  const jobsMap = dbData.project_jobs[projectId] || {};
  return Object.values(jobsMap).filter((j) => j.status === 'queued' || j.status === 'running');
};

const getProjectJobs = ({ projectId, userId }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  const jobsMap = dbData.project_jobs[projectId] || {};
  return Object.values(jobsMap).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

// ─── Project Builds Logic ─────────────────────────────────────────────────────

const createBuild = ({ projectId, userId, status = 'pending', logs = '', previewUrl = '' }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  const buildId = uuidv4();
  const now = new Date().toISOString();

  const buildRecord = {
    id: buildId,
    project_id: projectId,
    status: status || 'pending',
    logs: logs || '',
    preview_url: previewUrl || '',
    created_at: now,
    completed_at: (status === 'success' || status === 'failed') ? now : null
  };

  if (!dbData.project_builds[projectId]) {
    dbData.project_builds[projectId] = {};
  }

  dbData.project_builds[projectId][buildId] = buildRecord;
  saveDb();

  return buildRecord;
};

const updateBuild = ({ buildId, projectId, userId, status, logs, previewUrl }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  if (!dbData.project_builds[projectId] || !dbData.project_builds[projectId][buildId]) {
    throw new Error('Build record not found');
  }

  const buildRecord = dbData.project_builds[projectId][buildId];
  const now = new Date().toISOString();

  if (status) {
    buildRecord.status = status;
    if (status === 'success' || status === 'failed') {
      buildRecord.completed_at = now;
    }
  }
  if (logs !== undefined) buildRecord.logs = logs;
  if (previewUrl !== undefined) buildRecord.preview_url = previewUrl;

  saveDb();
  return buildRecord;
};

const getProjectBuilds = ({ projectId, userId }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  const buildsMap = dbData.project_builds[projectId] || {};
  return Object.values(buildsMap).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

// ─── Project Settings & Workspace State Logic ─────────────────────────

const getProjectSettings = ({ projectId, userId }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  const defaultSettings = {
    active_file: '/src/App.tsx',
    open_tabs: ['/src/App.tsx'],
    preview_device: 'desktop',
    theme: 'dark',
    updated_at: new Date().toISOString()
  };

  return dbData.project_settings[projectId] || defaultSettings;
};

const updateProjectSettings = ({ projectId, userId, settings = {} }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  const current = getProjectSettings({ projectId, userId });
  const updated = {
    ...current,
    ...settings,
    updated_at: new Date().toISOString()
  };

  dbData.project_settings[projectId] = updated;
  saveDb();

  return updated;
};

const getActiveProjectJob = ({ projectId, userId }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  return dbData.project_active_jobs[projectId] || null;
};

const setActiveProjectJob = ({ projectId, userId, jobData }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  if (jobData === null) {
    delete dbData.project_active_jobs[projectId];
  } else {
    dbData.project_active_jobs[projectId] = {
      ...jobData,
      updated_at: new Date().toISOString()
    };
  }

  saveDb();
  return dbData.project_active_jobs[projectId] || null;
};

/**
 * Composite single-pass workspace state restoration
 */
const getWorkspaceState = ({ projectId, userId, chatLimit = 50, chatBefore = null }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  const files = getProjectFiles({ projectId, userId });
  const chat = getProjectChat({ projectId, userId, limit: chatLimit, before: chatBefore });
  const events = getProjectEvents({ projectId, userId });
  const builds = getProjectBuilds({ projectId, userId });
  const settings = getProjectSettings({ projectId, userId });
  const activeJob = getActiveProjectJob({ projectId, userId });

  const latestBuild = builds.length > 0 ? builds[0] : null;

  return {
    project,
    files,
    chat,
    events,
    latest_build: latestBuild,
    settings,
    active_job: activeJob
  };
};

// ─── Audit Logging Logic ──────────────────────────────────────────────

const createAuditLog = ({ projectId, userId, action, ipAddress = '', userAgent = '', status = 'success', details = {} }) => {
  const auditId = uuidv4();
  const now = new Date().toISOString();

  const auditRecord = {
    id: auditId,
    project_id: projectId || 'system',
    user_id: userId || 'anonymous',
    action: action || 'GENERIC_ACTION',
    ip_address: ipAddress || '',
    user_agent: userAgent || '',
    status: status || 'success',
    details: details || {},
    timestamp: now
  };

  const key = projectId || 'system';
  if (!dbData.project_audit_logs[key]) {
    dbData.project_audit_logs[key] = [];
  }

  dbData.project_audit_logs[key].push(auditRecord);
  saveDb();

  return auditRecord;
};

const getProjectAuditLogs = ({ projectId, userId }) => {
  const project = getProjectByIdAndUserId(projectId, userId);
  if (!project) throw new Error('Unauthorized or project not found');

  return dbData.project_audit_logs[projectId] || [];
};

// Initialize DB on module load
initDb();

module.exports = {
  initDb,
  createProject,
  getProjectByIdAndUserId,
  getProjectsByUserId,
  updateProjectStatus,
  createProjectFile,
  updateProjectFile,
  deleteProjectFile,
  getProjectFiles,
  createChatMessage,
  getProjectChat,
  createProjectEvent,
  getProjectEvents,
  createBuild,
  updateBuild,
  getProjectBuilds,
  getProjectSettings,
  updateProjectSettings,
  getActiveProjectJob,
  setActiveProjectJob,
  getWorkspaceState,
  createJob,
  updateJob,
  getJobByIdAndUserId,
  getActiveJobsForProject,
  getProjectJobs,
  createAuditLog,
  getProjectAuditLogs,
  VALID_STATUSES,
  VALID_ROLES,
  VALID_MESSAGE_TYPES,
  VALID_JOB_STATUSES
};
