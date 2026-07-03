import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import InvestorMarketplace from './pages/InvestorMarketplace'
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
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/UserManagement'
import SearchResults from './pages/SearchResults'
import Notifications from './pages/Notifications'
import NotFound from './pages/NotFound'
import Files from './pages/Files'
import CoursesPage from './pages/CoursesPage'
import SettingsPage from './pages/SettingsPage'
import LandingPage from './pages/LandingPage'

// Decode the stored JWT and reject it if missing/malformed/expired. Returns the
// token payload ({ id, email, role, exp }) or null.
function readSession() {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // exp is in seconds; treat an expired token as no session.
    if (payload.exp && payload.exp * 1000 <= Date.now()) return null
    return payload
  } catch {
    return null
  }
}

// Guards a route. Requires a valid (non-expired) session; optionally restricts
// to specific roles. An unauthenticated visitor is sent to /login; a
// logged-in user hitting a page above their role is sent to their own home.
// Investors have a single-page experience (the marketplace) — they may not
// open any other app page.
const INVESTOR_ALLOWED = ['/homeinvestor']

function PrivateRoute({ children, roles }) {
  const session = readSession()
  const location = useLocation()
  if (!session) {
    localStorage.removeItem('token') // clear any stale/expired token
    return <Navigate to="/login" replace />
  }
  // Confine investors to their portal, whatever URL they try.
  if (session.role === 'investor') {
    const path = location.pathname.toLowerCase().replace(/\/+$/, '')
    if (!INVESTOR_ALLOWED.includes(path)) return <Navigate to="/HomeInvestor" replace />
    return children
  }
  if (roles && !roles.includes(session.role)) {
    // Logged in but not allowed on this page → force back to the login screen.
    return <Navigate to="/login" replace />
  }
  return children
}

// The student/investor feed. Each role has its own landing page, so we send
// the visitor to theirs: admins have NO feed — their home is the Dashboard, so
// hitting /home just bounces them there (replace → Back won't return here).
function RoleHome() {
  const session = readSession()
  if (!session) {
    localStorage.removeItem('token')
    return <Navigate to="/login" replace />
  }
  if (session.role === 'admin')  return <Navigate to="/Dashboard" replace />
  if (session.role === 'doctor') return <Navigate to="/HomeDoctor" replace />
  return <Home />
}

// Maps the current route to a browser-tab title. Exact paths first, then
// dynamic-route prefixes. Pages that set their own document.title still win,
// since their effect runs after this one.
const TITLES = {
  '/login': 'Login',
  '/register': 'Register',
  '/forgot-password': 'Forgot Password',
  '/otp-verification': 'OTP Verification',
  '/reset-password': 'Reset Password',
  '/notaccept': 'Account Pending',
  '/home': 'Home',
  '/homedoctor': 'Home',
  '/homeinvestor': 'Home',
  '/dashboard': 'Dashboard',
  '/profile': 'Profile',
  '/profile/edit': 'Edit Profile',
  '/edit-profile': 'Edit Profile',
  '/groups': 'Groups',
  '/my-groups': 'My Groups',
  '/create-group': 'Create Group',
  '/projects': 'Projects',
  '/courses': 'My Courses',
  '/reviews': 'Academic Reviews',
  '/files': 'Files',
  '/notifications': 'Notifications',
  '/search': 'Search',
  '/admin/users': 'User Management',
  '/settings': 'Settings',
  '/': 'Welcome',
}

function titleForPath(path) {
  const p = path.toLowerCase().replace(/\/+$/, '') || '/'
  if (TITLES[p]) return TITLES[p]
  if (p.startsWith('/profile/edit')) return 'Edit Profile'
  if (p.startsWith('/profile')) return 'Profile'
  if (p.startsWith('/groups/')) return 'Group'
  if (p.startsWith('/doctor/')) return 'Doctor Profile'
  if (p.startsWith('/posts/')) return 'Post'
  return 'UniConnect'
}

function TitleManager() {
  const { pathname } = useLocation()
  useEffect(() => {
    const name = titleForPath(pathname)
    document.title = name === 'UniConnect' ? 'UniConnect' : `${name} | UniConnect`
  }, [pathname])
  return null
}

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) return <UniConnectLoader />

  return (
    <BrowserRouter>
      <TitleManager />
      <Routes>
        {/* Public Routes */}
        <Route path="/"                  element={<LandingPage />} />
        <Route path="/login"             element={<Login />} />
        <Route path="/register"          element={<Register />} />
        <Route path="/forgot-password"   element={<ForgotPassword />} />
        <Route path="/otp-verification"  element={<OtpVerification />} />
        <Route path="/reset-password"    element={<ResetPassword />} />
        <Route path="/NotAccept"         element={<NotAccept />} />

        {/* Protected Routes */}
        <Route path="/home"              element={<PrivateRoute><RoleHome /></PrivateRoute>} />
        <Route path="/Home"              element={<PrivateRoute><RoleHome /></PrivateRoute>} />
        <Route path="/HomeDoctor"        element={<PrivateRoute><HomeDoctor /></PrivateRoute>} />
        <Route path="/HomeInvestor"      element={<PrivateRoute><InvestorMarketplace /></PrivateRoute>} />
        <Route path="/dashboard"         element={<PrivateRoute roles={['admin']}><Dashboard /></PrivateRoute>} />
        <Route path="/Dashboard"         element={<PrivateRoute roles={['admin']}><Dashboard /></PrivateRoute>} />

        {/* Profile */}
        <Route path="/profile"           element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/profile/:id"       element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/profile/edit"      element={<PrivateRoute><ProfileEdit /></PrivateRoute>} />
        <Route path="/edit-profile"      element={<PrivateRoute><ProfileEdit /></PrivateRoute>} />

        {/* Groups */}
        <Route path="/groups"            element={<PrivateRoute><GroupsList /></PrivateRoute>} />
        <Route path="/my-groups"         element={<PrivateRoute><MyGroups /></PrivateRoute>} />
        <Route path="/create-group"      element={<PrivateRoute><CreateGroup /></PrivateRoute>} />
        <Route path="/groups/:id"        element={<PrivateRoute><GroupDetails /></PrivateRoute>} />

        {/* Doctor */}
        <Route path="/doctor/:id"        element={<PrivateRoute><DoctorProfile /></PrivateRoute>} />

        {/* Projects */}
        <Route path="/projects"          element={<PrivateRoute><ProjectsPage /></PrivateRoute>} />

        {/* Posts */}
        <Route path="/posts/:id"         element={<PrivateRoute><PostDetails /></PrivateRoute>} />

        {/* Reviews */}
        <Route path="/reviews"           element={<PrivateRoute><AcademicReviewsPage /></PrivateRoute>} />

        {/* Files */}
        <Route path="/files"             element={<PrivateRoute><Files /></PrivateRoute>} />

        {/* Courses */}
        <Route path="/courses"           element={<PrivateRoute><CoursesPage /></PrivateRoute>} />

        {/* Settings */}
        <Route path="/settings"          element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

        {/* Notifications */}
        <Route path="/notifications"     element={<PrivateRoute><Notifications /></PrivateRoute>} />

        {/* Search */}
        <Route path="/search"            element={<PrivateRoute><SearchResults /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin/users"       element={<PrivateRoute roles={['admin']}><UserManagement /></PrivateRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App