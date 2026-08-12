const express = require('express');
const router = express.Router();
const { authenticateSession } = require('../middleware/auth');
const db = require('../data/db');
const assetsRouter = require('./assets');

// Apply authentication middleware to all project endpoints
router.use(authenticateSession);

// Mount asset storage routes under /api/projects/:projectId/assets
router.use('/:projectId/assets', assetsRouter);

/**
 * POST /api/projects
 * Creates a new project for the authenticated user
 */
router.post('/', (req, res) => {
  try {
    const { name, prompt, framework } = req.body || {};

    if (!prompt && !name) {
      return res.status(400).json({
        success: false,
        error: 'Project prompt or name is required'
      });
    }

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
});

/**
 * GET /api/projects/:projectId
 * Returns project details ONLY if it belongs to the authenticated user
 */
router.get('/:projectId', (req, res) => {
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
    console.error('[Projects API] Error fetching project:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch project'
    });
  }
});

/**
 * GET /api/projects
 * Returns all projects owned by the authenticated user
 */
router.get('/', (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const projects = db.getProjectsByUserId(authenticatedUserId);

    return res.json({
      success: true,
      projects
    });
  } catch (err) {
    console.error('[Projects API] Error listing projects:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to list projects'
    });
  }
});

// ─── PROJECT FILES ENDPOINTS ──────────────────────────────────────────────────

router.get('/:projectId/files', (req, res) => {
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
});

router.post('/:projectId/files', (req, res) => {
  try {
    const { projectId } = req.params;
    const authenticatedUserId = req.user.id;
    const { path: filePath, filename, content, language } = req.body || {};

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'File path is required' });
    }

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
});

router.delete('/:projectId/files', (req, res) => {
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
});

// ─── PROJECT CHAT ENDPOINTS ───────────────────────────────────────────────────

router.get('/:projectId/chat', (req, res) => {
  try {
    const { projectId } = req.params;
    const authenticatedUserId = req.user.id;

    const chat = db.getProjectChat({ projectId, userId: authenticatedUserId });
    return res.json({ success: true, chat });
  } catch (err) {
    return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
      success: false,
      error: err.message
    });
  }
});

router.post('/:projectId/chat', (req, res) => {
  try {
    const { projectId } = req.params;
    const authenticatedUserId = req.user.id;
    const { role, content, message_type, metadata } = req.body || {};

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
});

// ─── PROJECT EVENTS ENDPOINTS ─────────────────────────────────────────────────

router.get('/:projectId/events', (req, res) => {
  try {
    const { projectId } = req.params;
    const authenticatedUserId = req.user.id;

    const events = db.getProjectEvents({ projectId, userId: authenticatedUserId });
    return res.json({ success: true, events });
  } catch (err) {
    return res.status(err.message.includes('Unauthorized') ? 404 : 500).json({
      success: false,
      error: err.message
    });
  }
});

router.post('/:projectId/events', (req, res) => {
  try {
    const { projectId } = req.params;
    const authenticatedUserId = req.user.id;
    const { event_type, payload } = req.body || {};

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
});

// ─── PROJECT BUILDS ENDPOINTS ─────────────────────────────────────────────────

router.get('/:projectId/builds', (req, res) => {
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
});

router.post('/:projectId/builds', (req, res) => {
  try {
    const { projectId } = req.params;
    const authenticatedUserId = req.user.id;
    const { status, logs, preview_url } = req.body || {};

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
});

router.patch('/:projectId/builds/:buildId', (req, res) => {
  try {
    const { projectId, buildId } = req.params;
    const authenticatedUserId = req.user.id;
    const { status, logs, preview_url } = req.body || {};

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
});

module.exports = router;
