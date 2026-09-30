import axios from 'axios'

// VITE_DEMO=true (set on Vercel) → no backend: requests are answered from
// src/demo/demo-data.json by src/demo/mockApi.js. Locally leave it unset and
// the real backend (via the Vite proxy) is used exactly as before.
const DEMO = import.meta.env.VITE_DEMO === 'true'

// In development VITE_API_URL is empty → baseURL is '/api', which Vite proxies
// to the local backend. In production (Vercel) set VITE_API_URL to the deployed
// backend, e.g.  https://your-backend.up.railway.app/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  ...(DEMO ? { adapter: async (config) => (await import('../demo/mockApi.js')).handle(config) } : {})
})

// بعت التوكن تلقائياً مع كل request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
