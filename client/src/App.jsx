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
        <Route path="/home"              element={<Home />} />
        <Route path="/HomeDoctor"        element={<HomeDoctor />} />
        <Route path="/dashboard"         element={<Dashboard />} />

        {/* Profile */}
        <Route path="/profile"           element={<ProfilePage />} />
        <Route path="/myprofile"         element={<ProfilePage />} />
        <Route path="/profile/edit"      element={<ProfileEdit />} />

        {/* Groups */}
        <Route path="/groups"            element={<GroupsList />} />
        <Route path="/my-groups"         element={<MyGroups />} />
        <Route path="/create-group"      element={<CreateGroup />} />
        <Route path="/groups/:id"        element={<GroupDetails />} />

        {/* Doctor */}
        <Route path="/doctor/:id"        element={<DoctorProfile />} />

        {/* Projects */}
        <Route path="/projects"          element={<ProjectsPage />} />

        {/* Posts */}
        <Route path="/posts/:id"         element={<PostDetails />} />

        {/* Reviews */}
        <Route path="/reviews"           element={<AcademicReviewsPage />} />

        {/* Files */}
        <Route path="/files"             element={<Files />} />

        {/* Notifications */}
        <Route path="/notifications"     element={<Notifications />} />

        {/* Search */}
        <Route path="/search"            element={<SearchResults />} />

        {/* Admin */}
        <Route path="/admin/users"       element={<UserManagement />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App