import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGET = 'http://localhost:5000'

// Transient connection errors are expected in dev: the API server may be
// restarting (nodemon), stopped, or a WebSocket upgrade may abort when a tab
// closes. Without a handler, http-proxy re-throws and Vite floods the console
// with full stack traces. We swallow the known-benign codes and keep anything
// genuinely unexpected to a single concise line.
const BENIGN = new Set(['ECONNREFUSED', 'ECONNABORTED', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT']);

let warnedBackendDown = false;

function quietProxy(target, extra = {}) {
  return {
    target,
    changeOrigin: true,
    ...extra,
    configure(proxy) {
      proxy.on('error', (err, _req, res) => {
        if (BENIGN.has(err.code)) {
          // Hint once that the backend is unreachable, then stay silent.
          if (err.code === 'ECONNREFUSED' && !warnedBackendDown) {
            warnedBackendDown = true;
            console.warn(`\x1b[33m[proxy] API server not reachable at ${target} — is the backend running? (cd server && npm run dev)\x1b[0m`);
          }
          // Close the HTTP response cleanly so the request doesn't hang.
          // For WS upgrades, res is a raw socket — just destroy it.
          try {
            if (res && typeof res.writeHead === 'function' && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: 'Backend unavailable' }));
            } else if (res && typeof res.destroy === 'function') {
              res.destroy();
            }
          } catch { /* socket already gone */ }
          return;
        }
        console.warn(`\x1b[33m[proxy] ${err.code || err.message}\x1b[0m`);
      });

      // Reset the "backend down" notice once a request succeeds again.
      proxy.on('proxyRes', () => { warnedBackendDown = false; });
    },
  };
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // expose on the local network (phone access)
    proxy: {
      '/api':       quietProxy(API_TARGET),
      '/uploads':   quietProxy(API_TARGET),
      '/socket.io': quietProxy(API_TARGET, { ws: true }),
    },
  },
})
