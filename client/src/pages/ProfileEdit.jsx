import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GoogleAuthButton from "../components/GoogleAuthButton";
import "../styles/ProfileEdit.css";

const API_BASE = "/api";
const getToken = () => localStorage.getItem("token");

const authFetch = (url, options = {}) =>
  fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });

// ضغط الصورة وتحويلها لـ base64 بحد أقصى 800px وجودة 80%
function compressAndEncodeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let w = img.width;
        let h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round((h * MAX) / w); w = MAX; }
          else       { w = Math.round((w * MAX) / h); h = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfileEdit() {
  const navigate = useNavigate();
  const fileRef = useRef();

  const [userId,      setUserId]      = useState(null);
  const [avatar,      setAvatar]      = useState(null);
  const [avatarFile,  setAvatarFile]  = useState(null);
  const [name,        setName]        = useState("");
  const [bio,         setBio]         = useState("");
  const [phone,       setPhone]       = useState("");
  const [faculty,     setFaculty]     = useState("");
  const [year,        setYear]        = useState("Year 1");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState(null);

  // Google linked-account status
  const [google, setGoogle] = useState({ linked: false, google_email: null, has_password: true });
  const [googleBusy, setGoogleBusy] = useState(false);

  const fetchGoogleStatus = () => {
    authFetch(`${API_BASE}/auth/google/status`)
      .then((r) => r.json())
      .then((d) => setGoogle(d))
      .catch(() => {});
  };

  useEffect(() => {
    document.title = "Edit Profile | UniConnect";
    authFetch(`${API_BASE}/users/me`)
      .then((r) => r.json())
      .then((data) => {
        const u = data.user || data;
        setUserId(u.id);
        setName(u.name || "");
        setBio(u.bio || "");
        setPhone(u.phone_number || "");
        setFaculty(u.faculty || "");
        setYear(u.academic_year ? `Year ${u.academic_year}` : "Year 1");
        if (u.profile_picture) setAvatar(u.profile_picture);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetchGoogleStatus();
  }, []);

  const handleLinkGoogle = async (accessToken) => {
    setGoogleBusy(true);
    try {
      const res = await authFetch(`${API_BASE}/auth/google/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showMsg("Google account linked ✓", "success");
      fetchGoogleStatus();
    } catch (err) {
      showMsg(err.message || "Failed to link Google", "error");
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    setGoogleBusy(true);
    try {
      const res = await authFetch(`${API_BASE}/auth/google/unlink`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showMsg("Google account unlinked", "success");
      fetchGoogleStatus();
    } catch (err) {
      showMsg(err.message || "Failed to unlink Google", "error");
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatar(URL.createObjectURL(file));
  };

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);

    try {
      let pictureData = null;
      if (avatarFile) {
        pictureData = await compressAndEncodeImage(avatarFile);
      }

      const yearNum = year.replace("Year ", "").replace("Graduate", "5");

      const res = await authFetch(`${API_BASE}/users/${userId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bio,
          phone_number: phone,
          profile_picture: pictureData,
          faculty,
          major: faculty,
          academic_year: yearNum,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      if (newPass) {
        if (newPass !== confirmPass) {
          showMsg("Passwords do not match", "error");
          setSaving(false);
          return;
        }
        if (newPass.length < 7) {
          showMsg("Password must be at least 7 characters", "error");
          setSaving(false);
          return;
        }
        // password change via auth reset flow — show message
        showMsg("Profile saved! Password change requires email verification.", "success");
      } else {
        showMsg("Profile saved successfully!", "success");
      }
    } catch {
      showMsg("Failed to save. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#00e5ff" }}>
        Loading...
      </div>
    );
  }

  const initials = name ? name.slice(0, 2).toUpperCase() : "ME";

  return (
    <div className="ep-page">
      {/* NAV */}
      <nav className="ep-nav">
        <div className="ep-logo">
          <div className="ep-logo-icon">
            <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%" }} />
          </div>
          <span className="ep-logo-text">
            Uni<span className="ep-logo-accent">Connect</span>
          </span>
        </div>
        <button className="ep-back-btn" onClick={() => navigate(-1)}>
          <span className="ep-back-arrow">←</span> Back
        </button>
      </nav>

      <div className="ep-container">
        <div className="ep-header">
          <div>
            <h1 className="ep-title">Edit Profile</h1>
            <p className="ep-subtitle">Update your information and manage your account</p>
          </div>
          <div className="ep-header-icon">🎓</div>
        </div>

        {msg && (
          <div style={{
            padding: "12px 16px", borderRadius: "8px", marginBottom: "16px",
            background: msg.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
            color: msg.type === "success" ? "#22c55e" : "#ef4444",
            border: `1px solid ${msg.type === "success" ? "#22c55e" : "#ef4444"}`,
          }}>
            {msg.text}
          </div>
        )}

        {/* SECTION 1: Personal Information */}
        <section className="ep-section">
          <div className="ep-section-header">
            <div className="ep-section-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h2 className="ep-section-title">Personal Information</h2>
              <p className="ep-section-desc">Update your personal details and how others see you.</p>
            </div>
          </div>

          <div className="ep-personal-grid">
            {/* Avatar */}
            <div className="ep-avatar-col">
              <div className="ep-avatar-wrap">
                <div className="ep-avatar-ring">
                  {avatar
                    ? <img src={avatar} alt="avatar" className="ep-avatar-img" onError={() => setAvatar(null)} />
                    : <div className="ep-avatar-placeholder">{initials}</div>
                  }
                </div>
                <button className="ep-avatar-edit-btn" onClick={() => fileRef.current.click()}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="ep-hidden" onChange={handleAvatar} />
              </div>
              <p className="ep-avatar-label">Profile Photo</p>
              <p className="ep-avatar-hint">JPG, PNG or GIF. Max 5MB.</p>
              <button className="ep-change-photo" onClick={() => fileRef.current.click()}>Change Photo</button>
            </div>

            {/* Fields */}
            <div className="ep-fields-col">
              <div className="ep-field">
                <label className="ep-label">Full Name</label>
                <div className="ep-input-wrap">
                  <svg className="ep-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input className="ep-input" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" />
                </div>
              </div>

              <div className="ep-field">
                <label className="ep-label">Bio</label>
                <div className="ep-textarea-wrap">
                  <svg className="ep-input-icon ep-input-icon--top" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  <textarea className="ep-textarea" value={bio} onChange={e => setBio(e.target.value)} maxLength={200} rows={4} />
                </div>
                <span className="ep-char-count">{bio.length}/200</span>
              </div>

              <div className="ep-row">
                <div className="ep-field ep-field--half">
                  <label className="ep-label">Phone Number</label>
                  <div className="ep-input-wrap">
                    <svg className="ep-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <input className="ep-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+20 1xx xxx xxxx" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Academic Information */}
        <section className="ep-section ep-section--academic">
          <div className="ep-section-header">
            <div className="ep-section-icon ep-section-icon--academic">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div>
              <h2 className="ep-section-title">Academic Information</h2>
              <p className="ep-section-desc">Tell us about your academic background.</p>
            </div>
          </div>

          <div className="ep-row">
            <div className="ep-field ep-field--grow">
              <label className="ep-label">Faculty &amp; Department</label>
              <div className="ep-input-wrap">
                <svg className="ep-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                </svg>
                <input className="ep-input" value={faculty} onChange={e => setFaculty(e.target.value)} placeholder="Faculty & Department" />
              </div>
            </div>

            <div className="ep-field ep-field--year">
              <label className="ep-label">Academic Year</label>
              <div className="ep-select-wrap">
                <svg className="ep-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <select className="ep-select" value={year} onChange={e => setYear(e.target.value)}>
                  <option>Year 1</option>
                  <option>Year 2</option>
                  <option>Year 3</option>
                  <option>Year 4</option>
                  <option>Graduate</option>
                </select>
                <svg className="ep-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Linked Accounts */}
        <section className="ep-section">
          <div className="ep-section-header">
            <div className="ep-section-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <div>
              <h2 className="ep-section-title">Linked Accounts</h2>
              <p className="ep-section-desc">Connect Google to sign in faster and recover your password.</p>
            </div>
          </div>

          <div className="ep-linked-row">
            <div className="ep-linked-info">
              <svg width="22" height="22" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              <div>
                <p className="ep-linked-name">Google</p>
                <p className="ep-linked-status">
                  {google.linked
                    ? <>Linked · <span className="ep-linked-email">{google.google_email}</span></>
                    : "Not connected"}
                </p>
              </div>
            </div>

            {google.linked ? (
              <button
                className="ep-unlink-btn"
                onClick={handleUnlinkGoogle}
                disabled={googleBusy}
                title={google.has_password ? "" : "Set a password first to unlink"}
              >
                {googleBusy ? "…" : "Unlink"}
              </button>
            ) : (
              <div className="ep-link-btn-wrap">
                <GoogleAuthButton onToken={handleLinkGoogle} disabled={googleBusy} label="Link Google" />
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: Security */}
        <section className="ep-section ep-section--security">
          <div className="ep-section-header">
            <div className="ep-section-icon ep-section-icon--security">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <h2 className="ep-section-title">Security</h2>
              <p className="ep-section-desc">Update your password to keep your account secure.</p>
            </div>
          </div>

          <div className="ep-field">
            <label className="ep-label">New Password</label>
            <div className="ep-input-wrap">
              <svg className="ep-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input className="ep-input" type={showNew ? "text" : "password"} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password (optional)" />
              <button className="ep-eye-btn" onClick={() => setShowNew(v => !v)}>
                {showNew
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <div className="ep-field">
            <label className="ep-label">Confirm New Password</label>
            <div className="ep-input-wrap">
              <svg className="ep-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                className={`ep-input ${confirmPass && confirmPass !== newPass ? "ep-input--error" : ""}`}
                type={showConfirm ? "text" : "password"}
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                placeholder="Confirm new password"
              />
              <button className="ep-eye-btn" onClick={() => setShowConfirm(v => !v)}>
                {showConfirm
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {confirmPass && confirmPass !== newPass && (
              <p className="ep-error-msg">Passwords do not match</p>
            )}
          </div>
        </section>

        {/* SAVE BUTTON */}
        <div className="ep-save-bar">
          <button className={`ep-save-btn ${saving ? "ep-save-btn--saved" : ""}`} onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
