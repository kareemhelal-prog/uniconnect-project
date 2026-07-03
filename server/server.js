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

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
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
