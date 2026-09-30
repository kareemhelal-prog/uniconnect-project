import axios from 'axios'

// Demo mode = production build WITHOUT VITE_API_URL (i.e. Vercel with no backend):
// requests are answered from src/demo/demo-data.json by src/demo/mockApi.js.
// Locally (npm run dev) the real backend is used exactly as before.
// To use a real backend on Vercel later, just set VITE_API_URL.
const DEMO = import.meta.env.PROD && !import.meta.env.VITE_API_URL

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
