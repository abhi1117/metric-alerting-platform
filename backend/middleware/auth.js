const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

/**
 * Middleware to verify JWT token and extract user info
 * Token should be in Authorization header: Bearer <token>
 */
exports.protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Missing or invalid authorization header", { path: req.path });
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const secret = process.env.JWT_SECRET || "super-secret-key-change-in-production";

    try {
      const decoded = jwt.verify(token, secret);
      req.userId = decoded.userId;
      req.username = decoded.username;
      
      logger.debug("Token verified", { userId: req.userId, path: req.path });
      next();
    } catch (err) {
      logger.warn("Invalid or expired token", { error: err.message, path: req.path });
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  } catch (err) {
    logger.error("Auth middleware error", err);
    return res.status(500).json({ error: "Authentication error" });
  }
};
