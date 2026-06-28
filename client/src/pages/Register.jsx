import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Register.css";
import logoImg from "../assets/logo.png";
import api from "../api/axios";
import GoogleAuthButton from "../components/GoogleAuthButton";

/* ─── Inline icons ─── */
const I = {
  student: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  doctor: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
  investor: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  arrow: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  back: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  check: () => (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  code: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  network: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" /><rect x="16" y="16" width="6" height="6" rx="1" />
      <path d="M12 8v4M12 12H5v4M12 12h7v4" />
    </svg>
  ),
};

const ROLES = [
  { key: "student",  label: "Student",  desc: "Posts, courses, groups & files for your year", icon: I.student },
  { key: "doctor",   label: "Doctor",   desc: "Mentor students and publish academic reviews",  icon: I.doctor },
  { key: "investor", label: "Investor", desc: "Discover and support student projects",          icon: I.investor },
];

const YEARS = [
  { v: "1", label: "First Year" },
  { v: "2", label: "Second Year" },
  { v: "3", label: "Third Year" },
  { v: "4", label: "Fourth Year" },
];

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  // Google completion mode arrives via navigation state from Login.
  const googleState = location.state?.googleComplete;
  const [googleMode, setGoogleMode] = useState(!!googleState);
  const [gToken, setGToken] = useState(googleState?.token || sessionStorage.getItem("gToken") || "");

  const [step, setStep] = useState("role"); // role | details | settings | submitted
  const [role, setRole] = useState("");
  const [form, setForm] = useState({
    name: googleState?.prefill?.name || "",
    studentId: "",
    phone: "",
    email: googleState?.prefill?.email || "",
    password: "",
    confirmPass: "",
    academicYear: "",
    track: "",
  });
  const [errors, setErrors] = useState({});
  const [general, setGeneral] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = "Register | UniConnect"; }, []);
  useEffect(() => {
    if (googleState?.token) sessionStorage.setItem("gToken", googleState.token);
  }, [googleState]);

  // Ordered steps depend on the role (only students have the settings step).
  const steps = role === "student"
    ? ["role", "details", "settings"]
    : ["role", "details"];
  const stepIndex = Math.min(steps.indexOf(step), steps.length - 1);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); setGeneral(""); };

  /* ── Google sign-up that needs completion → start the wizard ── */
  const handleGoogleToken = async (accessToken) => {
    setLoading(true);
    setGeneral("");
    try {
      const { data } = await api.post("/auth/google", { access_token: accessToken });
      if (data.needsProfile) {
        // Switch into Google completion mode in-place — no reload.
        sessionStorage.setItem("gToken", data.token);
        setGToken(data.token);
        setGoogleMode(true);
        setForm((f) => ({ ...f, name: data.user.name || f.name, email: data.user.email || f.email }));
        setStep("role");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.user.role);
        navigate("/Home");
      }
    } catch (err) {
      setGeneral(err.response?.data?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  /* ── Per-step validation ── */
  const validateDetails = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (role === "student" && !form.studentId.trim()) e.studentId = "Academic ID is required.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    if (!googleMode) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
      if (form.password.length < 7) e.password = "Min 7 characters.";
      if (form.password !== form.confirmPass) e.confirmPass = "Passwords don't match.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateSettings = () => {
    const e = {};
    if (!form.academicYear) e.academicYear = "Please select your year.";
    if ((form.academicYear === "3" || form.academicYear === "4") && !form.track) e.track = "Please select your specialization.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Navigation ── */
  const next = () => {
    setGeneral("");
    if (step === "role") {
      if (!role) { setGeneral("Please choose how you'll use UniConnect."); return; }
      setStep("details");
    } else if (step === "details") {
      if (!validateDetails()) return;
      if (role === "student") setStep("settings");
      else submit();
    } else if (step === "settings") {
      if (!validateSettings()) return;
      submit();
    }
  };

  const back = () => {
    setGeneral(""); setErrors({});
    if (step === "details") setStep("role");
    else if (step === "settings") setStep("details");
  };

  /* ── Map backend error codes to the right field/step ── */
  const handleBackendError = (err) => {
    const data = err.response?.data || {};
    const code = data.code;
    const map = {
      registry_not_found: { field: "studentId", step: "details" },
      name_mismatch:      { field: "name",      step: "details" },
      already_claimed:    { field: "studentId", step: "details" },
      year_mismatch:      { field: "academicYear", step: "settings" },
      track_mismatch:     { field: "track",     step: "settings" },
    };
    if (code && map[code]) {
      setErrors((e) => ({ ...e, [map[code].field]: data.message }));
      setStep(map[code].step);
    } else {
      setGeneral(data.message || "Something went wrong. Please try again.");
    }
  };

  const submit = async () => {
    setLoading(true);
    setGeneral("");
    const payload = { role, name: form.name.trim(), phone_number: form.phone.trim() };
    if (role === "student") {
      payload.studentId = form.studentId.trim();
      payload.academicYear = form.academicYear;
      payload.track = (form.academicYear === "3" || form.academicYear === "4") ? form.track : null;
    }
    if (!googleMode) { payload.email = form.email.trim(); payload.password = form.password; }

    try {
      if (googleMode) {
        await api.post("/auth/complete-registration", payload, { headers: { Authorization: `Bearer ${gToken}` } });
        sessionStorage.removeItem("gToken");
      } else {
        await api.post("/auth/register", payload);
      }
      setStep("submitted");
    } catch (err) {
      handleBackendError(err);
    } finally {
      setLoading(false);
    }
  };

  /* ═══════════ Render ═══════════ */
  const Brand = (
    <h1 className="register-brand">
      <span className="rb-text">UniC</span>
      <span className="rb-o-wrap" aria-hidden="true"><img src={logoImg} alt="" className="rb-o-logo" /></span>
      <span className="rb-text">nnect</span>
    </h1>
  );

  if (step === "submitted") {
    return (
      <>
        <div className="page-bg" aria-hidden="true" />
        <div className="page-overlay" aria-hidden="true" />
        <div className="register-page">
          <div className="register-wrapper">
            {Brand}
            <main className="register-card wiz-review">
              <span className="wiz-review-icon"><I.check /></span>
              <h2 className="wiz-review-title">Account under review</h2>
              <p className="wiz-review-text">
                Thanks{form.name ? `, ${form.name.split(" ")[0]}` : ""}! Your details were submitted to the
                administration. We'll verify them and activate your account within
                <strong> 2 days</strong>. You'll be able to log in once it's approved.
              </p>
              <button className="register-btn" onClick={() => navigate("/login")}>Back to Login</button>
            </main>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-bg" aria-hidden="true" />
      <div className="page-overlay" aria-hidden="true" />

      <div className="register-page">
        <div className="register-wrapper">
          {Brand}

          <main className="register-card">
            {/* Progress */}
            <div className="wiz-progress">
              {steps.map((s, i) => (
                <div key={s} className="wiz-progress-item">
                  <span className={`wiz-dot ${i < stepIndex ? "done" : ""} ${i === stepIndex ? "active" : ""}`}>{i + 1}</span>
                  {i < steps.length - 1 && <span className={`wiz-line ${i < stepIndex ? "done" : ""}`} />}
                </div>
              ))}
            </div>

            {/* ── Step 1: Role ── */}
            {step === "role" && (
              <div className="wiz-step">
                <h2 className="register-title">How will you use UniConnect?</h2>
                <div className="role-grid">
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        className={`role-pick ${role === r.key ? "selected" : ""}`}
                        onClick={() => setRole(r.key)}
                      >
                        <span className="role-pick-icon"><Icon /></span>
                        <span className="role-pick-body">
                          <span className="role-pick-label">{r.label}</span>
                          <span className="role-pick-desc">{r.desc}</span>
                        </span>
                        <span className="role-pick-radio" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Step 2: Details ── */}
            {step === "details" && (
              <div className="wiz-step">
                <h2 className="register-title">
                  {role === "student" ? "Your university details" : "Your details"}
                </h2>
                {role === "student" && (
                  <p className="wiz-hint">Enter your name and academic ID exactly as registered at your university.</p>
                )}

                <div className="register-form">
                  <div>
                    <label className="field-label">Full Name</label>
                    <input className={`register-input ${errors.name ? "error" : ""}`}
                      placeholder="e.g. Ahmed Mohamed Ali"
                      value={form.name} onChange={(e) => set("name", e.target.value)} />
                    <p className="field-error">{errors.name}</p>
                  </div>

                  {role === "student" && (
                    <div>
                      <label className="field-label">Academic ID</label>
                      <input className={`register-input ${errors.studentId ? "error" : ""}`}
                        placeholder="As registered at your university"
                        value={form.studentId} onChange={(e) => set("studentId", e.target.value)} />
                      <p className="field-error">{errors.studentId}</p>
                    </div>
                  )}

                  <div>
                    <label className="field-label">Phone Number</label>
                    <input className={`register-input ${errors.phone ? "error" : ""}`} type="tel"
                      placeholder="01XXXXXXXXX"
                      value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                    <p className="field-error">{errors.phone}</p>
                  </div>

                  {!googleMode && (
                    <>
                      <div>
                        <label className="field-label">Email Address</label>
                        <input className={`register-input ${errors.email ? "error" : ""}`} type="email"
                          placeholder="example@mail.com"
                          value={form.email} onChange={(e) => set("email", e.target.value)} />
                        <p className="field-error">{errors.email}</p>
                      </div>
                      <div className="register-pw-row">
                        <div>
                          <label className="field-label">Password</label>
                          <input className={`register-input ${errors.password ? "error" : ""}`} type="password"
                            placeholder="Min 7 chars"
                            value={form.password} onChange={(e) => set("password", e.target.value)} />
                          <p className="field-error">{errors.password}</p>
                        </div>
                        <div>
                          <label className="field-label">Confirm</label>
                          <input className={`register-input ${errors.confirmPass ? "error" : ""}`} type="password"
                            placeholder="Repeat"
                            value={form.confirmPass} onChange={(e) => set("confirmPass", e.target.value)} />
                          <p className="field-error">{errors.confirmPass}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {googleMode && (
                    <p className="wiz-google-note">Signed in with Google as <strong>{form.email}</strong></p>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 3: Settings (student only) ── */}
            {step === "settings" && (
              <div className="wiz-step">
                <h2 className="register-title">Account settings</h2>
                <p className="wiz-hint">This decides the year and group your account belongs to.</p>

                <label className="field-label">Which year are you in?</label>
                <div className="year-grid">
                  {YEARS.map((y) => (
                    <button key={y.v} type="button"
                      className={`year-pick ${form.academicYear === y.v ? "selected" : ""}`}
                      onClick={() => { set("academicYear", y.v); if (y.v === "1" || y.v === "2") set("track", ""); }}>
                      <span className="year-pick-num">{y.v}</span>
                      <span className="year-pick-label">{y.label}</span>
                    </button>
                  ))}
                </div>
                <p className="field-error">{errors.academicYear}</p>

                {(form.academicYear === "3" || form.academicYear === "4") && (
                  <div className="track-block">
                    <label className="field-label">Your specialization</label>
                    <div className="track-grid">
                      <button type="button"
                        className={`track-pick ${form.track === "software" ? "selected" : ""}`}
                        onClick={() => set("track", "software")}>
                        <span className="track-pick-icon"><I.code /></span>
                        <span className="track-pick-label">Software</span>
                      </button>
                      <button type="button"
                        className={`track-pick ${form.track === "networks" ? "selected" : ""}`}
                        onClick={() => set("track", "networks")}>
                        <span className="track-pick-icon"><I.network /></span>
                        <span className="track-pick-label">Networks</span>
                      </button>
                    </div>
                    <p className="field-error">{errors.track}</p>
                  </div>
                )}
              </div>
            )}

            {general && <p className="field-error general-error">{general}</p>}

            {/* ── Actions ── */}
            <div className="wiz-actions">
              {step !== "role" && (
                <button type="button" className="wiz-back-btn" onClick={back} disabled={loading}>
                  <I.back /> Back
                </button>
              )}
              <button type="button" className="register-btn wiz-next-btn" onClick={next} disabled={loading}>
                {loading ? "Please wait…"
                  : step === "settings" || (step === "details" && role !== "student")
                    ? "Submit for review"
                    : <>Continue <I.arrow /></>}
              </button>
            </div>

            {/* Google + login link only on first step */}
            {step === "role" && !googleMode && (
              <>
                <div className="auth-divider">OR</div>
                <GoogleAuthButton onToken={handleGoogleToken} disabled={loading} />
                <p className="register-footer">
                  Already have an account? <a onClick={() => navigate("/login")}>Log in</a>
                </p>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
