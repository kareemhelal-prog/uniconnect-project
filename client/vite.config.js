import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGET = 'http://localhost:5000'

// --- Quiet, benign dev-proxy noise -----------------------------------------
// In development the API is proxied to the backend. Two classes of messages
// clutter the console but mean nothing is actually wrong:
//   1. WebSocket aborts/resets — socket.io reconnecting, or a tab closing
//      ("ws proxy error", "write ECONNABORTED", "ECONNRESET").
//   2. Connection refusals while the backend restarts (nodemon) or is stopped
//      ("ECONNREFUSED").
// Vite logs (1) itself via its internal ws handler, so a custom logger that
// drops these lines is the only way to silence them without hiding real errors.
const PROXY_NOISE = /ws proxy|ECONNABORTED|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE/

const logger = createLogger()
const _error = logger.error.bind(logger)
const _warn = logger.warn.bind(logger)
logger.error = (msg, opts) => { if (typeof msg === 'string' && PROXY_NOISE.test(msg)) return; _error(msg, opts) }
logger.warn = (msg, opts) => { if (typeof msg === 'string' && PROXY_NOISE.test(msg)) return; _warn(msg, opts) }

let warnedBackendDown = false

function quietProxy(target, extra = {}) {
  return {
    target,
    changeOrigin: true,
    ...extra,
    configure(proxy) {
      proxy.on('error', (err, _req, res) => {
        // Hint once (via plain console, so it survives the noise filter) that
        // the backend is unreachable, then close the response/socket cleanly.
        if (err.code === 'ECONNREFUSED' && !warnedBackendDown) {
          warnedBackendDown = true
          console.warn(`\x1b[33m[proxy] API server not reachable at ${target} — is the backend running? (cd server && npm run dev)\x1b[0m`)
        }
        try {
          if (res && typeof res.writeHead === 'function' && !res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'Backend unavailable' }))
          } else if (res && typeof res.destroy === 'function') {
            res.destroy()
          }
        } catch { /* socket already gone */ }
      })
      proxy.on('proxyRes', () => { warnedBackendDown = false })
    },
  }
}

export default defineConfig({
  customLogger: logger,
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
