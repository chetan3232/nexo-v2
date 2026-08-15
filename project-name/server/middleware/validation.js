const { z } = require('zod');

// ─── ZOD SCHEMAS ─────────────────────────────────────────────────────────────

const CreateProjectSchema = z.object({
  name: z.string().max(100).optional(),
  prompt: z.string().min(1, 'Prompt cannot be empty').max(10000),
  framework: z.string().max(30).optional()
});

const ProjectFileSchema = z.object({
  path: z.string().min(1, 'Path is required').max(500),
  filename: z.string().max(200).optional(),
  content: z.string(),
  language: z.string().max(50).optional()
});

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string(),
  message_type: z.enum([
    'user_prompt',
    'thinking',
    'planning',
    'file_created',
    'code_generation',
    'build',
    'error',
    'success',
    'final'
  ]).optional(),
  metadata: z.record(z.any()).optional()
});

const ProjectEventSchema = z.object({
  event_type: z.string().min(1).max(100),
  payload: z.record(z.any()).optional()
});

const BuildSchema = z.object({
  status: z.enum(['pending', 'building', 'success', 'failed']).optional(),
  logs: z.string().optional(),
  preview_url: z.string().max(1000).optional()
});

const SettingsSchema = z.object({
  active_file: z.string().max(500).optional(),
  open_tabs: z.array(z.string().max(500)).optional(),
  preview_device: z.enum(['desktop', 'tablet', 'mobile']).optional(),
  theme: z.enum(['light', 'dark']).optional()
});

/**
 * Middleware factory for Zod body validation
 */
const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issues = err.issues || err.errors || [];
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        issues: issues.map(e => ({ field: (e.path || []).join('.'), message: e.message }))
      });
    }
    return res.status(400).json({ success: false, error: 'Invalid request payload' });
  }
};

module.exports = {
  CreateProjectSchema,
  ProjectFileSchema,
  ChatMessageSchema,
  ProjectEventSchema,
  BuildSchema,
  SettingsSchema,
  validateBody
};
