// server/config/socket.js
//
// Socket.io real-time layer. Attached to the existing HTTP server (no
// separate server). Each authenticated user auto-joins their personal room
// `user_{id}`; clients join `post_{id}` rooms when viewing a post.
//
// Events are always emitted AFTER the controller has persisted to the DB.

const jwt = require("jsonwebtoken");
require("dotenv").config();

let io = null;

function initSocket(server) {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Soft auth: read JWT from the handshake. We never hard-reject — anonymous
  // sockets simply don't join a personal room (and so receive nothing private).
  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
      } catch {
        /* invalid token → treat as anonymous */
      }
    }
    next();
  });

  io.on("connection", (socket) => {
    if (socket.userId) socket.join(`user_${socket.userId}`);

    // Post pages join/leave their room to receive reactions & comments
    socket.on("join_post", (postId) => {
      if (postId != null) socket.join(`post_${postId}`);
    });
    socket.on("leave_post", (postId) => {
      if (postId != null) socket.leave(`post_${postId}`);
    });
  });

  console.log("⚡ Socket.io ready");
  return io;
}

function getIO() {
  return io;
}

// ── Emit helpers (no-op if io isn't initialised) ──────────────
function emitToPost(postId, event, payload) {
  if (io && postId != null) io.to(`post_${postId}`).emit(event, payload);
}

function emitToUser(userId, event, payload) {
  if (io && userId != null) io.to(`user_${userId}`).emit(event, payload);
}

module.exports = { initSocket, getIO, emitToPost, emitToUser };
