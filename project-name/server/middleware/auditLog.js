const db = require('../data/db');

/**
 * Express middleware for audit logging
 */
const auditLogMiddleware = (actionName) => (req, res, next) => {
  const originalJson = res.json;

  res.json = function (body) {
    res.json = originalJson;

    const projectId = req.params.projectId || req.body?.projectId || null;
    const userId = req.user?.id || 'anonymous';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';
    const userAgent = req.headers['user-agent'] || '';
    const isSuccess = res.statusCode >= 200 && res.statusCode < 400;

    try {
      db.createAuditLog({
        projectId,
        userId,
        action: actionName || `${req.method} ${req.baseUrl}${req.path}`,
        ipAddress,
        userAgent,
        status: isSuccess ? 'SUCCESS' : `FAILED_${res.statusCode}`,
        details: {
          statusCode: res.statusCode,
          params: req.params,
          query: req.query
        }
      });
    } catch (err) {
      console.error('[AuditLog] Error recording audit log:', err);
    }

    return res.json(body);
  };

  next();
};

module.exports = { auditLogMiddleware };
