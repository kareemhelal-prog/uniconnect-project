// client/src/socket.js
//
// Single shared Socket.io connection for the whole app. Connects to the same
// origin (proxied to the backend by Vite — see vite.config.js), authenticating
// with the JWT from localStorage so the server can join our personal room.

import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  const token = localStorage.getItem("token");

  if (!socket) {
    socket = io("/", {
      auth: { token },
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  } else if (token && socket.auth?.token !== token) {
    // Token changed (login/logout) → reconnect with the new identity
    socket.auth = { token };
    socket.disconnect().connect();
  }

  return socket;
}

// Convenience helpers for post rooms
export function joinPost(postId) {
  if (postId != null) getSocket().emit("join_post", postId);
}
export function leavePost(postId) {
  if (postId != null) getSocket().emit("leave_post", postId);
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
