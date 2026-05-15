import { useState } from "react";
import { useEffect } from "react";
import logo from '../assets/logo.png';
import "../styles/Login.css";
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState(null);

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  useEffect(() => {
    document.title = "Login | UniConnect";
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      showMsg("Please enter your email and password", "error");
      return;
    }
    if (!email.includes("@")) {
      showMsg("Invalid university email", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);

      showMsg("Login successful ✓", "success");

      setTimeout(() => {
        if (user.role === 'admin')    navigate('/Dashboard');
        if (user.role === 'student')  navigate('/Home');
        if (user.role === 'doctor')   navigate('/HomeDoctor');
        if (user.role === 'investor') navigate('/HomeInvestor');
      }, 800);

    } catch (error) {
      const msg = error.response?.data?.message || "Something went wrong";
      if (msg === "User not found")   showMsg("Email not found", "error");
      else if (msg === "Wrong password") showMsg("Wrong password", "error");
      else showMsg(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => navigate('/register');

  const handleForgot = (e) => {
    e.preventDefault();
    navigate('/forgot-password');
  };

  return (
    <div className="uc-page">
      <div className="blob blob-blue" />
      <div className="blob blob-purple" />

      <div className="uc-wrapper">
        <div className="uc-logo-area">
          <img src={logo} alt="UniConnect Logo" className="uc-logo-img" />
          <h1 className="uc-brand">UniConnect</h1>
        </div>

        <div className="uc-grid">
          <div className="uc-card uc-card-main">
            <div className="uc-card-glow" />
            <h2 className="uc-card-title">Log In or Register</h2>

            <form className="uc-form" onSubmit={handleLogin} noValidate>
              <input
                type="email"
                placeholder="University Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="uc-input"
              />

              <div className="uc-pass-row">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="uc-input uc-input-flex"
                />
                <div className="uc-remember">
                  <span className="uc-remember-label">Remember Me</span>
                  <label className="uc-toggle">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={() => setRemember(!remember)}
                      className="uc-toggle-input"
                    />
                    <span className={`uc-toggle-track ${remember ? "checked" : ""}`}>
                      <span className="uc-toggle-thumb" />
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className={`uc-login-btn ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? <span className="uc-spinner" /> : "LOG IN"}
              </button>
            </form>

            <div className="uc-forgot-wrap">
              <a href="#" className="uc-forgot" onClick={handleForgot}>
                Forgot Password?
              </a>
            </div>

            {msg && (
              <div className={`uc-msg uc-msg-${msg.type}`}>
                {msg.text}
              </div>
            )}
          </div>

          <div className="uc-card uc-card-side">
            <h3 className="uc-side-new">New to</h3>
            <span className="uc-side-brand">UniConnect?</span>
            <button className="uc-register-btn" onClick={handleRegister}>
              REGISTER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}