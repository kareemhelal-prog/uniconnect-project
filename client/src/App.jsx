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
        <Route path="/Home"              element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/Dashboard"         element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile"           element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/profile/:id"       element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/profile/edit"      element={<PrivateRoute><ProfileEdit /></PrivateRoute>} />
        <Route path="/CreateGroup"       element={<PrivateRoute><CreateGroup /></PrivateRoute>} />
        <Route path="/GroupsList"        element={<PrivateRoute><GroupsList /></PrivateRoute>} />
        <Route path="/MyGroups"          element={<PrivateRoute><MyGroups /></PrivateRoute>} />
        <Route path="/group/details/:id" element={<PrivateRoute><GroupDetails /></PrivateRoute>} />
        <Route path="/DoctorProfile/:id" element={<PrivateRoute><DoctorProfile /></PrivateRoute>} />
        <Route path="/ProjectsPage"      element={<PrivateRoute><ProjectsPage /></PrivateRoute>} />
        <Route path="/AcademicReviews"   element={<PrivateRoute><AcademicReviewsPage /></PrivateRoute>} />
        <Route path="/PostDetails/:id"   element={<PrivateRoute><PostDetails /></PrivateRoute>} />
        <Route path="/SearchResults"     element={<PrivateRoute><SearchResults /></PrivateRoute>} />
        <Route path="/notifications"     element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/files"             element={<PrivateRoute><Files /></PrivateRoute>} />
        <Route path="/UserManagement"    element={<PrivateRoute><UserManagement /></PrivateRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App