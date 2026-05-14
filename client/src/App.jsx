import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import OtpVerification from './pages/OtpVerification'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/Home'
import ProfilePage from './pages/ProfilePage' // ده هيفضل زي ما هو للعرض
import ProfileEdit from './pages/ProfileEdit' // ده الملف الجديد اللي انت عملته للتعديل
import Dashboard from './pages/Dashboard'
import Notifications from "./pages/Notifications";
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/otp-verification" element={<OtpVerification />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App