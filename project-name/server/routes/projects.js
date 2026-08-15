const express = require('express');
const router = express.Router();
const { authenticateSession } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { auditLogMiddleware } = require('../middleware/auditLog');
const {
  CreateProjectSchema,
  ProjectFileSchema,
  ChatMessageSchema,
  ProjectEventSchema,
  BuildSchema,
  SettingsSchema,
  validateBody
} = require('../middleware/validation');
const db = require('../data/db');
const assetsRouter = require('./assets');

// Apply security middlewares to all project endpoints
router.use(authenticateSession);
router.use(rateLimiter);

// Mount access-controlled asset storage routes under /api/projects/:projectId/assets
router.use('/:projectId/assets', assetsRouter);

/**
 * POST /api/projects
 * Creates a new project for the authenticated user
 */
router.post(
  '/',
  validateBody(CreateProjectSchema),
  auditLogMiddleware('CREATE_PROJECT'),
  (req, res) => {
    try {
      const { name, prompt, framework } = req.body;
      const authenticatedUserId = req.user.id;

      const project = db.createProject({
        userId: authenticatedUserId,
        name: name || (prompt ? prompt.slice(0, 30).trim() + '...' : 'Untitled Project'),
        initialPrompt: prompt || '',
        framework: framework || 'react'
      });

      return res.status(201).json({
        success: true,
        project: {
          id: project.id,
          user_id: project.user_id,
          name: project.name,
          initial_prompt: project.initial_prompt,
          framework: project.framework,
          status: project.status,
          created_at: project.created_at,
          updated_at: project.updated_at
        }
      });
    } catch (err) {
      console.error('[Projects API] Error creating project:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to create project'
      });
    }
  }
);

/**
 * GET /api/projects/:projectId
 * Returns project details ONLY if it belongs to the authenticated user
 */
router.get(
  '/:projectId',
  auditLogMiddleware('GET_PROJECT'),
  (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;

      const project = db.getProjectByIdAndUserId(projectId, authenticatedUserId);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      return res.json({
        success: true,
        project
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch project'
      });
    }
  }
);

/**
 * GET /api/projects
 * Returns all projects owned by the authenticated user
 */
router.get(
  '/',
  auditLogMiddleware('LIST_PROJECTS'),
  (req, res) => {
    try {
      const authenticatedUserId = req.user.id;
      const projects = db.getProjectsByUserId(authenticatedUserId);

      return res.json({
        success: true,
        projects
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to list projects'
      });
    }
  }
);

// ─── WORKSPACE HYDRATION ENDPOINT ───────────────────────────────────────────────

router.get(
  '/:projectId/workspace-state',
  auditLogMiddleware('GET_WORKSPACE_STATE'),
  (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;
      const { limit, before } = req.query;

      const state = db.getWorkspaceState({
        projectId,
        userId: authenticatedUserId,
        chatLimit: limit,
        chatBefore: before
      });

      return res.json({
        success: true,
        workspace: state
      });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

// ─── PROJECT FILES ENDPOINTS ──────────────────────────────────────────────────

router.get(
  '/:projectId/files',
  auditLogMiddleware('GET_PROJECT_FILES'),
  (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;

      const files = db.getProjectFiles({ projectId, userId: authenticatedUserId });
      return res.json({ success: true, files });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

router.post(
  '/:projectId/files',
  validateBody(ProjectFileSchema),
  auditLogMiddleware('SAVE_PROJECT_FILE'),
  (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;
      const { path: filePath, filename, content, language } = req.body;

      const file = db.createProjectFile({
        projectId,
        userId: authenticatedUserId,
        path: filePath,
        filename,
        content: content || '',
        language: language || 'javascript'
      });

      return res.status(201).json({ success: true, file });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

router.delete(
  '/:projectId/files',
  auditLogMiddleware('DELETE_PROJECT_FILE'),
  (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;
      const filePath = req.body?.path || req.query?.path;

      if (!filePath) {
        return res.status(400).json({ success: false, error: 'File path is required' });
      }

      const deleted = db.deleteProjectFile({
        projectId,
        userId: authenticatedUserId,
        path: filePath
      });

      return res.json({ success: deleted });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

// ─── PROJECT CHAT ENDPOINTS ───────────────────────────────────────────────────

router.get(
  '/:projectId/chat',
  auditLogMiddleware('GET_PROJECT_CHAT'),
  (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;
      const { limit, before } = req.query;

      const chatData = db.getProjectChat({
        projectId,
        userId: authenticatedUserId,
        limit,
        before
      });

      return res.json({
        success: true,
        ...chatData
      });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

router.post(
  '/:projectId/chat',
  validateBody(ChatMessageSchema),
  auditLogMiddleware('ADD_CHAT_MESSAGE'),
  (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;
      const { role, content, message_type, metadata } = req.body;

      const message = db.createChatMessage({
        projectId,
        userId: authenticatedUserId,
        role: role || 'user',
        content: content || '',
        messageType: message_type || 'user_prompt',
        metadata: metadata || {}
      });

      return res.status(201).json({ success: true, message });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

// ─── PROJECT EVENTS ENDPOINTS ─────────────────────────────────────────────────

router.get(
  '/:projectId/events',
  auditLogMiddleware('GET_PROJECT_EVENTS'),
  (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;
      const sinceSequence = req.query.since_sequence || req.query.since;

      const events = db.getProjectEvents({
        projectId,
        userId: authenticatedUserId,
        sinceSequence
      });
      return res.json({ success: true, events });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

router.post(
  '/:projectId/events',
  validateBody(ProjectEventSchema),
  auditLogMiddleware('LOG_PROJECT_EVENT'),
  (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;
      const { event_type, payload } = req.body;

      const event = db.createProjectEvent({
        projectId,
        userId: authenticatedUserId,
        eventType: event_type || 'GENERIC_EVENT',
        payload: payload || {}
      });

      return res.status(201).json({ success: true, event });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

// ─── PROJECT BUILDS ENDPOINTS ─────────────────────────────────────────────────

router.get(
  '/:projectId/builds',
  auditLogMiddleware('GET_PROJECT_BUILDS'),
  (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;

      const builds = db.getProjectBuilds({ projectId, userId: authenticatedUserId });
      return res.json({ success: true, builds });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

router.post(
  '/:projectId/builds',
  validateBody(BuildSchema),
  auditLogMiddleware('CREATE_PROJECT_BUILD'),
  (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;
      const { status, logs, preview_url } = req.body;

      const build = db.createBuild({
        projectId,
        userId: authenticatedUserId,
        status: status || 'pending',
        logs: logs || '',
        previewUrl: preview_url || ''
      });

      return res.status(201).json({ success: true, build });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

router.patch(
  '/:projectId/builds/:buildId',
  validateBody(BuildSchema),
  auditLogMiddleware('UPDATE_PROJECT_BUILD'),
  (req, res) => {
    try {
      const { projectId, buildId } = req.params;
      const authenticatedUserId = req.user.id;
      const { status, logs, preview_url } = req.body;

      const build = db.updateBuild({
        buildId,
        projectId,
        userId: authenticatedUserId,
        status,
        logs,
        previewUrl: preview_url
      });

      return res.json({ success: true, build });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

// ─── PROJECT SETTINGS ENDPOINTS ───────────────────────────────────────────────

router.get(
  '/:projectId/settings',
  auditLogMiddleware('GET_PROJECT_SETTINGS'),
  (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;

      const settings = db.getProjectSettings({ projectId, userId: authenticatedUserId });
      return res.json({ success: true, settings });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

router.patch(
  '/:projectId/settings',
  validateBody(SettingsSchema),
  auditLogMiddleware('UPDATE_PROJECT_SETTINGS'),
  (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;
      const settingsUpdates = req.body;

      const settings = db.updateProjectSettings({
        projectId,
        userId: authenticatedUserId,
        settings: settingsUpdates
      });

      return res.json({ success: true, settings });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

// ─── PROJECT ACTIVE JOB ENDPOINTS ─────────────────────────────────────────────

router.get(
  '/:projectId/active-job',
  auditLogMiddleware('GET_ACTIVE_JOB'),
  (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;

      const activeJob = db.getActiveProjectJob({ projectId, userId: authenticatedUserId });
      return res.json({ success: true, active_job: activeJob });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

router.post(
  '/:projectId/active-job',
  auditLogMiddleware('SET_ACTIVE_JOB'),
  (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;
      const jobData = req.body?.job || req.body;

      const activeJob = db.setActiveProjectJob({
        projectId,
        userId: authenticatedUserId,
        jobData: (jobData && Object.keys(jobData).length > 0) ? jobData : null
      });

      return res.json({ success: true, active_job: activeJob });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

// ─── PROJECT-AWARE AI EXECUTION ENDPOINT ───────────────────────────────────────

const { executeProjectAiFlow } = require('../services/projectAiOrchestrator');

router.post(
  '/:projectId/ai/execute',
  auditLogMiddleware('EXECUTE_PROJECT_AI'),
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;
      const { prompt } = req.body || {};

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Prompt string is required'
        });
      }

      const result = await executeProjectAiFlow({
        projectId,
        userId: authenticatedUserId,
        prompt: prompt.trim()
      });

      return res.json({
        success: true,
        result
      });
    } catch (err) {
      console.error('[Projects API] AI Execution Error:', err);
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

// ─── PERSISTENT BACKGROUND AI JOBS ENDPOINTS ───────────────────────────────────

const {
  enqueueBackgroundJob,
  cancelJob,
  jobStreamEmitter
} = require('../services/jobQueueService');

/**
 * POST /api/projects/:projectId/jobs
 * Enqueues a new persistent background AI job
 */
router.post(
  '/:projectId/jobs',
  auditLogMiddleware('ENQUEUE_BACKGROUND_JOB'),
  (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;
      const { type, payload } = req.body || {};

      const job = enqueueBackgroundJob({
        projectId,
        userId: authenticatedUserId,
        type: type || 'code_generation',
        payload: payload || {}
      });

      return res.status(202).json({
        success: true,
        job
      });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

/**
 * GET /api/projects/:projectId/jobs/active
 * Returns running or queued background jobs for the project
 */
router.get(
  '/:projectId/jobs/active',
  auditLogMiddleware('GET_ACTIVE_JOBS'),
  (req, res) => {
    try {
      const { projectId } = req.params;
      const authenticatedUserId = req.user.id;

      const jobs = db.getActiveJobsForProject({ projectId, userId: authenticatedUserId });
      return res.json({
        success: true,
        jobs
      });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

/**
 * GET /api/projects/:projectId/jobs/:jobId
 * Returns current status of a specific job
 */
router.get(
  '/:projectId/jobs/:jobId',
  auditLogMiddleware('GET_JOB_STATUS'),
  (req, res) => {
    try {
      const { projectId, jobId } = req.params;
      const authenticatedUserId = req.user.id;

      const job = db.getJobByIdAndUserId(jobId, projectId, authenticatedUserId);
      if (!job) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      return res.json({ success: true, job });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

/**
 * GET /api/projects/:projectId/jobs/:jobId/stream
 * Server-Sent Events (SSE) stream for real-time job progress
 */
router.get(
  '/:projectId/jobs/:jobId/stream',
  (req, res) => {
    try {
      const { projectId, jobId } = req.params;
      const authenticatedUserId = req.user.id;

      const job = db.getJobByIdAndUserId(jobId, projectId, authenticatedUserId);
      if (!job) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      // Configure SSE Headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      // Send initial status event
      res.write(`data: ${JSON.stringify({ type: 'init', job })}\n\n`);

      const eventListener = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
          res.end();
        }
      };

      jobStreamEmitter.on(`job:${jobId}`, eventListener);

      req.on('close', () => {
        jobStreamEmitter.removeListener(`job:${jobId}`, eventListener);
      });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

/**
 * POST /api/projects/:projectId/jobs/:jobId/cancel
 * Cancels a running or queued job
 */
router.post(
  '/:projectId/jobs/:jobId/cancel',
  auditLogMiddleware('CANCEL_JOB'),
  (req, res) => {
    try {
      const { projectId, jobId } = req.params;
      const authenticatedUserId = req.user.id;

      const cancelledJob = cancelJob({ jobId, projectId, userId: authenticatedUserId });
      return res.json({ success: true, job: cancelledJob });
    } catch (err) {
      return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
        success: false,
        error: err.message
      });
    }
  }
);

module.exports = router;
