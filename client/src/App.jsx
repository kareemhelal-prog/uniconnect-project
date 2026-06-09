import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
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
      <Routes>
        {/* Public Routes */}
        <Route path="/"                  element={<Navigate to="/login" />} />
        <Route path="/login"             element={<Login />} />
        <Route path="/register"          element={<Register />} />
        <Route path="/forgot-password"   element={<ForgotPassword />} />
        <Route path="/otp-verification"  element={<OtpVerification />} />
        <Route path="/reset-password"    element={<ResetPassword />} />
        <Route path="/NotAccept"         element={<NotAccept />} />

        {/* Protected Routes */}
        <Route path="/home"              element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/HomeDoctor"        element={<PrivateRoute><HomeDoctor /></PrivateRoute>} />
        <Route path="/dashboard"         element={<PrivateRoute><Dashboard /></PrivateRoute>} />

        {/* Profile */}
        <Route path="/profile"           element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/profile/:id"       element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/profile/edit"      element={<PrivateRoute><ProfileEdit /></PrivateRoute>} />

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

        {/* Notifications */}
        <Route path="/notifications"     element={<PrivateRoute><Notifications /></PrivateRoute>} />

        {/* Search */}
        <Route path="/search"            element={<PrivateRoute><SearchResults /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin/users"       element={<PrivateRoute><UserManagement /></PrivateRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App