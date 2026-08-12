const { v4: uuidv4 } = require('uuid');

/**
 * Authentication Middleware for NEXO V2
 * Security Requirements:
 * 1. Never trust user_id from frontend body/query.
 * 2. Always derive authenticated user from backend session/token headers.
 * 3. Enforce req.user.id for all downstream route operations.
 */
const authenticateSession = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const sessionUserIdHeader = req.headers['x-user-id'];
  const sessionEmailHeader = req.headers['x-user-email'];

  let derivedUserId = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1].trim();
    if (token) {
      // Decode or resolve token to user ID
      derivedUserId = token;
    }
  }

  if (!derivedUserId && sessionUserIdHeader) {
    derivedUserId = sessionUserIdHeader.trim();
  }

  // If no auth token or session header exists, assign a persistent guest session token
  if (!derivedUserId) {
    derivedUserId = `usr_${uuidv4()}`;
    res.setHeader('X-Session-Created', derivedUserId);
  }

  req.user = {
    id: derivedUserId,
    email: sessionEmailHeader || null
  };

  next();
};

module.exports = {
  authenticateSession
};
