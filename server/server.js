require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");

const { testConnection } = require("./config/db");
const { initSocket } = require("./config/socket");

const authRoutes         = require("./routes/authRoutes");
const userRoutes         = require("./routes/userRoutes");
const postRoutes         = require("./routes/postRoutes");
const commentRoutes      = require("./routes/commentRoutes");
const likeRoutes         = require("./routes/likeRoutes");
const followRoutes       = require("./routes/followRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const groupRoutes = require("./routes/groupRoutes");
const fileRoutes = require("./routes/fileRoutes");
const groupPostRoutes = require("./routes/groupPostRoutes");
const profileRoutes   = require("./routes/profileRoutes");
const projectRoutes   = require("./routes/projectRoutes");
const reviewRoutes    = require("./routes/reviewRoutes");
const courseRoutes    = require("./routes/courseRoutes");
const reportRoutes      = require("./routes/reportRoutes");
const emailAlertsRoutes = require("./routes/emailAlertsRoutes");
const app = express();
const adminRoutes = require("./routes/adminRoutes");

// ── CORS ──────────────────────────────────────────────────────────────────
// Auth is Bearer-token based (no cookies), so CORS isn't a CSRF vector here —
// but we still lock the API to known origins in production. Set CORS_ORIGINS
// to a comma-separated allowlist (e.g. "https://app.uniconnect.edu"). When it's
// unset (local dev / LAN phone testing) we stay permissive so nothing breaks.
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors(
  allowedOrigins.length
    ? {
        origin(origin, cb) {
          // Allow same-origin / server-to-server (no Origin header) and the allowlist.
          if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
          return cb(new Error("Not allowed by CORS"));
        },
      }
    : {} // no allowlist configured → reflect all origins (dev)
));

// ── Security headers ────────────────────────────────────────────────────────
// Restore a Content-Security-Policy (it had been disabled). This is a JSON API
// plus a few static images, so a tight policy adds defence-in-depth with no
// impact on the separately-served SPA.
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  // Let the SPA (a different origin) embed the public project images.
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

testConnection();

// Project cover images are public marketing images — serve ONLY this subfolder
// statically. The protected files library (uploads/files) stays behind its
// auth-checked download controller and is deliberately NOT exposed here.
app.use("/uploads/projects", express.static(path.join(__dirname, "uploads/projects")));

app.use("/api/auth",          authRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/posts",         postRoutes);
app.use("/api/comments",      commentRoutes);
app.use("/api/likes",         likeRoutes);
app.use("/api/follow",        followRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/group-posts", groupPostRoutes);
app.use("/api/files",    fileRoutes);
app.use("/api/profile",  profileRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/reviews",  reviewRoutes);
app.use("/api/courses",  courseRoutes);
app.use("/api/reports",  reportRoutes);
// Email-alerts router carries its own auth+admin guards; mount the more
// specific path BEFORE the generic /api/admin router so it matches first.
app.use("/api/admin/emails", emailAlertsRoutes);
app.use("/api/admin",    adminRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5000;

// Wrap Express in an HTTP server so Socket.io can share the same port
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
  console.log(`👉 http://localhost:${PORT}`);
});
