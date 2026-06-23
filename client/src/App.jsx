import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import UniConnectLoader from './pages/LoadingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import NotAccept from './pages/NotAccept'
import CreateGroup from './pages/CreateGroup'
import GroupsList from './pages/GroupsList'
import MyGroups from './pages/MyGroups'
import ForgotPassword from './pages/ForgotPassword'
import OtpVerification from './pages/OtpVerification'
import DoctorProfile from './pages/DoctorProfile'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/Home'
import HomeDoctor from './pages/HomeDoctor'
import ProjectsPage from './pages/ProjectsPage'
import AcademicReviewsPage from './pages/AcademicReviewsPage'
import PostDetails from './pages/PostDetails'
import ProfilePage from './pages/ProfilePage'
import GroupDetails from './pages/GroupDetails'
import ProfileEdit from './pages/ProfileEdit'
import Relations from './pages/Relations'
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/UserManagement'
import SearchResults from './pages/SearchResults'
import Notifications from './pages/Notifications'
import NotFound from './pages/NotFound'
import Files from './pages/Files'
import Navbar from './components/Navbar'
import ProjectsManagement from './pages/ProjectsManagement'
import InvestorPortal from './pages/InvestorPortal'
import GroupsManagement from './pages/GroupsManagement'
import postsManagement from './pages/postsManagement'
import ReportsManagement from './pages/ReportsManagement'
import ReviewsManagement from './pages/ReviewsManagement'
import Announcements from './pages/Announcements'
import EmailAlerts from './pages/EmailAlerts'

const NO_NAVBAR = [
  '/login', '/dashboard', '/home', '/homedoctor',
  '/register', '/forgot-password', '/otp-verification',
  '/reset-password', '/notaccept', '/','/notifications'
]

// FIX: ProtectedRoute — يمنع الدخول من غير token
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

function AppLayout() {
  const location = useLocation()
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState({})

  // FIX: بنسمع على تغييرات الـ token (login/logout)
  useEffect(() => {
    const handleStorage = () => setToken(localStorage.getItem('token'))
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // FIX: case-insensitive navbar check
  const hideNavbar = NO_NAVBAR.includes(location.pathname.toLowerCase()) || !token

  useEffect(() => {
    if (!token) return
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      // FIX: VITE_API_URL بدل localhost hardcoded
      fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(json => setUser(json.user || json))
        .catch(() => setUser({ id: payload.id, role: payload.role }))
    } catch {}
  }, [token])

  return (
    <>
      {!hideNavbar && <Navbar user={user} />}
      <Routes>
        {/* Public */}
        <Route path="/"                 element={<Navigate to="/login" replace />} />
        <Route path="/login"            element={<Login />} />
        <Route path="/register"         element={<Register />} />
        <Route path="/forgot-password"  element={<ForgotPassword />} />
        <Route path="/otp-verification" element={<OtpVerification />} />
        <Route path="/reset-password"   element={<ResetPassword />} />
        <Route path="/NotAccept"        element={<NotAccept />} />

        {/* Protected */}
        <Route path="/home"            element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/HomeDoctor"      element={<ProtectedRoute><HomeDoctor /></ProtectedRoute>} />
        <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* FIX: /profile/edit لازم تيجي قبل /profile/:id */}
        <Route path="/profile"         element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/edit"    element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
        <Route path="/profile/:id"     element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        <Route path="/groups"          element={<ProtectedRoute><GroupsList /></ProtectedRoute>} />
        <Route path="/my-groups"       element={<ProtectedRoute><MyGroups /></ProtectedRoute>} />
        <Route path="/create-group"    element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
        <Route path="/groups/:id"      element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />

        <Route path="/doctor/:id"      element={<ProtectedRoute><DoctorProfile /></ProtectedRoute>} />
        <Route path="/projects"        element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
        <Route path="/posts/:id"       element={<ProtectedRoute><PostDetails /></ProtectedRoute>} />
        <Route path="/reviews"         element={<ProtectedRoute><AcademicReviewsPage /></ProtectedRoute>} />
        <Route path="/files"           element={<ProtectedRoute><Files /></ProtectedRoute>} />
        <Route path="/notifications"   element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/search"          element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
        <Route path="/admin/users"     element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/Relations"       element={<ProtectedRoute><Relations /></ProtectedRoute>} />
        <Route path="/ProjectsManagement"       element={<ProtectedRoute><ProjectsManagement /></ProtectedRoute>} />
        <Route path="/InvestorPortal"  element={<ProtectedRoute><InvestorPortal /></ProtectedRoute>} />
        <Route path="/GroupsManagement"element={<ProtectedRoute><GroupsManagement /></ProtectedRoute>} />
        <Route path="/postsManagement" element={<ProtectedRoute><postsManagement /></ProtectedRoute>} />
        <Route path="/ReportsManagement"     element={<ProtectedRoute><ReportsManagement /></ProtectedRoute>} />
        <Route path="/Announcements"   element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
        <Route path="/ReviewsManagement"     element={<ProtectedRoute><ReviewsManagement /></ProtectedRoute>} />
        <Route path="/EmailAlerts"     element={<ProtectedRoute><EmailAlerts /></ProtectedRoute>} />
        <Route path="*"                element={<NotFound />} />
      </Routes>
    </>
  )
}

function App() {
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 2000)
    return () => clearTimeout(t)
  }, [])

  if (isLoading) return <UniConnectLoader />

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App