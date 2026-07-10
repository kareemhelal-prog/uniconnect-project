import axios from 'axios'

// In development VITE_API_URL is empty → baseURL is '/api', which Vite proxies
// to the local backend. In production (Vercel) set VITE_API_URL to the deployed
// backend, e.g.  https://your-backend.up.railway.app/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
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
