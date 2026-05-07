require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { testConnection } = require("./config/db");

const authRoutes         = require("./routes/authRoutes");
const userRoutes         = require("./routes/userRoutes");
const postRoutes         = require("./routes/postRoutes");
const commentRoutes      = require("./routes/commentRoutes");
const likeRoutes         = require("./routes/likeRoutes");
const followRoutes       = require("./routes/followRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

testConnection();

app.use("/api/auth",          authRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/posts",         postRoutes);
app.use("/api/comments",      commentRoutes);
app.use("/api/likes",         likeRoutes);
app.use("/api/follow",        followRoutes);
app.use("/api/notifications", notificationRoutes);

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
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
  console.log(`👉 http://localhost:${PORT}`);
});