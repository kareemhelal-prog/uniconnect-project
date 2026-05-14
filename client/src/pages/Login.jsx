import { useState } from "react";
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

const handleLogin = async (e) => {
  e.preventDefault();

  if (!email.trim() || !password) {
    showMsg(" please enter your email and password", "error");
    return;
  }
  if (!email.includes("@")) {
    showMsg("invalid university email", "error");
    return;
  }

  setLoading(true);

  // ⚡ مؤقت للـ frontend - bypass الـ server
  setTimeout(() => {
    localStorage.setItem('token', 'test-token');
    showMsg("login successful ✓", "success");
    setTimeout(() => navigate('/dashboard'), 1000);
    setLoading(false);
  }, 800);
};

const handleRegister = () => {
  navigate('/register')
}

const handleForgot = (e) => {
  e.preventDefault();
  navigate('/forgot-password')
}

  return (
    <div className="uc-page">
      {/* Background blobs */}
      <div className="blob blob-blue" />
      <div className="blob blob-purple" />

      <div className="uc-wrapper">

        {/* ── Logo ── */}
        <div className="uc-logo-area">
          <img
            src={logo}
            alt="UniConnect Logo"
            className="uc-logo-img"
          />
          <h1 className="uc-brand">UniConnect</h1>
        </div>

        {/* ── Cards grid ── */}
        <div className="uc-grid">

          {/* Login card */}
          <div className="uc-card uc-card-main">
            {/* inner border glow */}
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

          {/* Register side card */}
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
