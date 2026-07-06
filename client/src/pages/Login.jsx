import { useState, useEffect, useRef, useMemo } from "react";
import logo from '../assets/logo.png';
import "../styles/Login.css";
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import GoogleAuthButton from '../components/GoogleAuthButton';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

/* Activity icons drifting in the background */
function FloatIcon({ kind }) {
  const p = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (kind) {
    case "like":    return <svg {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>;
    case "comment": return <svg {...p}><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 21l1.9-4a8.4 8.4 0 0 1-.9-4 8.5 8.5 0 0 1 17 0z"/></svg>;
    case "chat":    return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg>;
    case "file":    return <svg {...p}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>;
    case "book":    return <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
    case "cap":     return <svg {...p}><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2.5 9 2.5 12 0v-5"/></svg>;
    case "users":   return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "star":    return <svg {...p}><polygon points="12 2 15.1 8.6 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.6 12 2"/></svg>;
    case "bulb":    return <svg {...p}><path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/></svg>;
    case "play":    return <svg {...p}><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>;
    default:        return null;
  }
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState(null);
  const [showForgot, setShowForgot] = useState(false);
  const glowRef = useRef(null);

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  useEffect(() => {
    document.title = "Login | UniConnect";
  }, []);

  // Cursor-following spotlight
  useEffect(() => {
    const move = (e) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`;
        glowRef.current.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // Gently floating icons that express what happens on the platform — likes,
  // comments, files, study, students, doctors, reviews, ideas.
  const floats = useMemo(() => {
    const kinds = ["like", "comment", "file", "book", "cap", "users", "star", "bulb", "chat", "play"];
    const colors = ["#22d3ee", "#a855f7", "#ec4899", "#38bdf8", "#818cf8"];
    const items = [];
    const cols = 8, rows = 4;            // spread across a loose grid, then jitter
    for (let i = 0; i < cols * rows; i++) {
      if (Math.random() < 0.35) continue; // leave gaps so it isn't crowded
      const cx = (i % cols) / cols * 100;
      const cy = Math.floor(i / cols) / rows * 100;
      items.push({
        kind: kinds[Math.floor(Math.random() * kinds.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        left: cx + (Math.random() * 8 - 4),
        top: cy + (Math.random() * 14 - 2),
        size: 22 + Math.random() * 26,
        dur: 7 + Math.random() * 7,
        delay: Math.random() * 6,
        opacity: 0.10 + Math.random() * 0.16,
      });
    }
    return items;
  }, []);

  // Route the user to the right home page based on their role
  const routeByRole = (role) => {
    if (role === 'admin')    navigate('/Dashboard');
    else if (role === 'doctor')   navigate('/HomeDoctor');
    else if (role === 'investor') navigate('/HomeInvestor');
    else navigate('/Home');
  };

  // Persistent message (won't auto-dismiss) — used for "under review" notices.
  const showMsgSticky = (text, type) => setMsg({ text, type });

  const handleGoogleToken = async (accessToken) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google', { access_token: accessToken });

      // New Google sign-up → finish the registration wizard first.
      if (data.needsProfile) {
        sessionStorage.setItem('gToken', data.token);
        navigate('/register', {
          state: { googleComplete: { token: data.token, prefill: { name: data.user.name, email: data.user.email } } },
        });
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      showMsg("Login successful ✓", "success");
      setTimeout(() => routeByRole(data.user.role), 700);
    } catch (error) {
      const code = error.response?.data?.code;
      if (code === 'pending' || code === 'rejected') {
        showMsgSticky(error.response.data.message, code === 'pending' ? 'info' : 'error');
      } else {
        showMsg(error.response?.data?.message || "Google sign-in failed", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      showMsg("Please enter your academic ID / email and password", "error");
      return;
    }

    setLoading(true);

    try {
      // `email` may be a university email OR an academic ID — the backend
      // resolves either to the account.
      const response = await api.post('/auth/login', { identifier: email.trim(), email: email.trim(), password });
      const { token, user } = response.data;

      // The account's role decides where the user lands — no manual selection.
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
      const code = error.response?.data?.code;
      const msg = error.response?.data?.message || "Something went wrong";
      if (code === "pending" || code === "rejected") {
        // Credentials were correct, but the account isn't approved yet.
        showMsgSticky(msg, code === "pending" ? "info" : "error");
      } else if (msg === "User not found")      showMsg("Email not found", "error");
      else if (msg === "Wrong password") showMsg("Wrong password", "error");
      else showMsg(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => navigate('/register');

  const handleForgot = (e) => {
    e.preventDefault();
    setShowForgot(true);
  };

  return (
    <div className="uc-page">
      <div className="blob blob-blue" />
      <div className="blob blob-purple" />
      <div className="uc-aurora" />
      <div className="uc-floats" aria-hidden="true">
        {floats.map((f, i) => (
          <span
            key={i}
            className="uc-float"
            style={{
              left: `${f.left}%`,
              top: `${f.top}%`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              color: f.color,
              opacity: f.opacity,
              "--dur": `${f.dur}s`,
              "--delay": `${f.delay}s`,
            }}
          >
            <FloatIcon kind={f.kind} />
          </span>
        ))}
      </div>
      <div className="uc-cursor-glow" ref={glowRef} aria-hidden="true" />

      <div className="uc-wrapper">
        <div className="uc-logo-area">
          <img src={logo} alt="UniConnect Logo" className="uc-logo-img" />
          <h1 className="uc-brand">UniConnect</h1>
        </div>

        <div className="uc-grid">
          <div className="uc-card uc-card-main">
            <div className="uc-card-glow" />
            <h2 className="uc-card-title">Log In Now</h2>

            <form className="uc-form" onSubmit={handleLogin} noValidate>
              <input
                type="text"
                placeholder="Academic ID or University Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="uc-input"
                autoComplete="username"
              />

              <div className="uc-pass-row">
                <div className="uc-pass-field">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="uc-input"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="uc-pass-eye"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
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

            <div className="auth-divider">OR</div>

            <GoogleAuthButton onToken={handleGoogleToken} disabled={loading} />

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

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}