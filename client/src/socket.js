// client/src/socket.js
//
// Single shared Socket.io connection for the whole app. Connects to the same
// origin (proxied to the backend by Vite — see vite.config.js), authenticating
// with the JWT from localStorage so the server can join our personal room.

import { io } from "socket.io-client";

// Socket.io connects to the backend ORIGIN (not the /api path). In development
// VITE_API_URL is empty → "/" (Vite proxies /socket.io to the local backend).
// In production, VITE_API_URL is like https://backend.up.railway.app/api, so we
// strip the trailing /api to get the backend origin the socket connects to.
const API_URL = import.meta.env.VITE_API_URL || "";
const SOCKET_URL = API_URL ? API_URL.replace(/\/api\/?$/, "") : "/";

let socket = null;

export function getSocket() {
  const token = localStorage.getItem("token");

  if (!socket) {
    socket = io(SOCKET_URL, {
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
