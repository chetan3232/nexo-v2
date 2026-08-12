const express = require('express');
const router = express.Router({ mergeParams: true });
const path = require('path');
const fs = require('fs');
const { authenticateSession } = require('../middleware/auth');
const db = require('../data/db');

router.use(authenticateSession);

const STORAGE_ROOT = path.join(__dirname, '../storage');

/**
 * Access-controlled static asset download endpoint
 * GET /api/projects/:projectId/assets/*
 */
router.get('/{*assetPath}', (req, res) => {
  try {
    const { projectId } = req.params;
    const authenticatedUserId = req.user.id;

    // Security check: Verify project ownership
    const project = db.getProjectByIdAndUserId(projectId, authenticatedUserId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const assetSubPath = Array.isArray(req.params.assetPath) ? req.params.assetPath.join('/') : req.params.assetPath;
    if (!assetSubPath) {
      return res.status(400).json({ success: false, error: 'Asset path is required' });
    }

    // Logical path: projects/{projectId}/assets/...
    const targetFilePath = path.join(STORAGE_ROOT, 'projects', projectId, 'assets', assetSubPath);

    // Prevent directory traversal
    if (!targetFilePath.startsWith(path.join(STORAGE_ROOT, 'projects', projectId, 'assets'))) {
      return res.status(403).json({ success: false, error: 'Invalid asset path' });
    }

    if (!fs.existsSync(targetFilePath)) {
      return res.status(404).json({ success: false, error: 'Asset file not found' });
    }

    return res.sendFile(targetFilePath);
  } catch (err) {
    console.error('[Assets API] Error reading asset:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve asset' });
  }
});

/**
 * Access-controlled asset upload endpoint
 * POST /api/projects/:projectId/assets/*
 */
router.post('/{*assetPath}', (req, res) => {
  try {
    const { projectId } = req.params;
    const authenticatedUserId = req.user.id;

    const project = db.getProjectByIdAndUserId(projectId, authenticatedUserId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const assetSubPath = Array.isArray(req.params.assetPath) ? req.params.assetPath.join('/') : req.params.assetPath;
    if (!assetSubPath) {
      return res.status(400).json({ success: false, error: 'Asset path is required' });
    }

    const assetDir = path.join(STORAGE_ROOT, 'projects', projectId, 'assets');
    const targetFilePath = path.join(assetDir, assetSubPath);

    if (!targetFilePath.startsWith(assetDir)) {
      return res.status(403).json({ success: false, error: 'Invalid asset path' });
    }

    const parentFolder = path.dirname(targetFilePath);
    if (!fs.existsSync(parentFolder)) {
      fs.mkdirSync(parentFolder, { recursive: true });
    }

    const { content, base64 } = req.body || {};
    let fileBuffer;

    if (base64) {
      fileBuffer = Buffer.from(base64, 'base64');
    } else if (typeof content === 'string') {
      fileBuffer = Buffer.from(content, 'utf8');
    } else {
      return res.status(400).json({ success: false, error: 'Content or base64 data required' });
    }

    fs.writeFileSync(targetFilePath, fileBuffer);

    return res.status(201).json({
      success: true,
      asset: {
        projectId,
        path: `/projects/${projectId}/assets/${assetSubPath}`,
        size: fileBuffer.length
      }
    });
  } catch (err) {
    console.error('[Assets API] Error uploading asset:', err);
    return res.status(500).json({ success: false, error: 'Failed to upload asset' });
  }
});

module.exports = router;
