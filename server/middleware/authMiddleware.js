require("dotenv").config();
const jwt = require("jsonwebtoken");
const { promisePool } = require("../config/db");

// In-memory throttle so we only touch the DB once per user per HEARTBEAT_MS,
// instead of on every single authenticated request. Resets on process restart.
const HEARTBEAT_MS = 60 * 1000; // refresh last_seen at most once a minute
const lastBeat = new Map();

function touchLastSeen(userId) {
  const now = Date.now();
  if (now - (lastBeat.get(userId) || 0) < HEARTBEAT_MS) return;
  lastBeat.set(userId, now);
  // Fire-and-forget — never block the request on the heartbeat write.
  promisePool
    .query("UPDATE Users SET last_seen = NOW() WHERE id = ?", [userId])
    .catch(() => {});
}

// =======================
// AUTH MIDDLEWARE
// =======================
module.exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1️⃣ Check if Authorization header exists
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "No token provided"
    });
  }

  // 2️⃣ Extract token
  const token = authHeader.split(" ")[1];

  // 3️⃣ Check JWT secret
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      message: "Server configuration error"
    });
  }

  try {
    // 4️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5️⃣ Attach user to request
    req.user = decoded;

    // 5.5️⃣ Online heartbeat (throttled, non-blocking)
    if (decoded?.id) touchLastSeen(decoded.id);

    // 6️⃣ Continue
    next();

  } catch (error) {

    // Token expired
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired"
      });
    }

    // Invalid token
    return res.status(401).json({
      message: "Invalid token"
    });
  }
};