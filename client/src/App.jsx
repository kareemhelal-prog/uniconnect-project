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
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/UserManagement'
import SearchResults from './pages/SearchResults'
import Notifications from './pages/Notifications'
import NotFound from './pages/NotFound'
import Files from './pages/Files'
import Navbar from './components/Navbar'

const NO_NAVBAR = ['/login','/dashboard','/home','/HomeDoctor', '/register', '/forgot-password', '/otp-verification', '/reset-password', '/NotAccept', '/']

function AppLayout() {
  const location = useLocation()
  const token = localStorage.getItem('token')
  const hideNavbar = NO_NAVBAR.includes(location.pathname) || !token

  const [user, setUser] = useState({})

  useEffect(() => {
    if (!token) return
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      fetch(`http://localhost:5000/api/users/me`, {
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
        <Route path="/"                 element={<Navigate to="/login" />} />
        <Route path="/login"            element={<Login />} />
        <Route path="/register"         element={<Register />} />
        <Route path="/forgot-password"  element={<ForgotPassword />} />
        <Route path="/otp-verification" element={<OtpVerification />} />
        <Route path="/reset-password"   element={<ResetPassword />} />
        <Route path="/NotAccept"        element={<NotAccept />} />

        {/* Protected */}
        <Route path="/home"             element={<Home />} />
        <Route path="/HomeDoctor"       element={<HomeDoctor />} />
        <Route path="/dashboard"        element={<Dashboard />} />

        <Route path="/profile"          element={<ProfilePage />} />
        <Route path="/myprofile"        element={<ProfilePage />} />
        <Route path="/profile/edit"     element={<ProfileEdit />} />

        <Route path="/groups"           element={<GroupsList />} />
        <Route path="/my-groups"        element={<MyGroups />} />
        <Route path="/create-group"     element={<CreateGroup />} />
        <Route path="/groups/:id"       element={<GroupDetails />} />

        <Route path="/doctor/:id"       element={<DoctorProfile />} />
        <Route path="/projects"         element={<ProjectsPage />} />
        <Route path="/posts/:id"        element={<PostDetails />} />
        <Route path="/reviews"          element={<AcademicReviewsPage />} />
        <Route path="/files"            element={<Files />} />
        <Route path="/notifications"    element={<Notifications />} />
        <Route path="/search"           element={<SearchResults />} />
        <Route path="/admin/users"      element={<UserManagement />} />
        <Route path="*"                 element={<NotFound />} />
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