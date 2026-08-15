/**
 * Rate Limiting Middleware for NEXO V2 API
 * Protects endpoints from burst spam and denial of service
 */

const requestCounts = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 120;   // 120 requests per minute

const rateLimiter = (req, res, next) => {
  const identifier = req.user?.id || req.ip || 'anonymous';
  const now = Date.now();

  if (!requestCounts.has(identifier)) {
    requestCounts.set(identifier, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  const record = requestCounts.get(identifier);

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + WINDOW_MS;
    return next();
  }

  record.count += 1;

  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      error: 'Too Many Requests. Rate limit exceeded. Please try again later.'
    });
  }

  next();
};

module.exports = { rateLimiter };
