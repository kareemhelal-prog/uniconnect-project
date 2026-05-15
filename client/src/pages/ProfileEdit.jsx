import { useState, useRef } from "react";
import { useEffect } from "react";

import "../styles/ProfileEdit.css";
const DEFAULT_SKILLS = ["Python", "Web Development", "Machine Learning", "React", "Data Structures", "Git", "SQL", "UI/UX Design"];

export default function ProfileEdit() {
  useEffect(() => {
    document.title = "Edit Profile | UniConnect";
}, []);
  const [avatar, setAvatar] = useState("/ahmed.png");
  const [name, setName] = useState("Ahmed Ayman");
  const [bio, setBio] = useState("Computer Science student passionate about AI, web development, and open source. Always learning and building.");
  const [status, setStatus] = useState("Active");
  const [phone, setPhone] = useState("+20 1280443768");
  const [linkedin, setLinkedin] = useState("https://www.linkedin.com/in/arjunpatel");
  const [github, setGithub] = useState("https://github.com/arjunpatel");
  const [faculty, setFaculty] = useState("Faculty of Engineering & Computer Science");
  const [year, setYear] = useState("Year 3");
  const [skills, setSkills] = useState(DEFAULT_SKILLS);
  const [skillInput, setSkillInput] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (file) setAvatar(URL.createObjectURL(file));
  };

  const handleSkillKey = (e) => {
    if ((e.key === "Enter" || e.key === ",") && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput("");
    }
  };

  const removeSkill = (sk) => setSkills(skills.filter((s) => s !== sk));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="ep-page">
      {/* NAV */}
      <nav className="ep-nav">
        <div className="ep-logo">
<div className="ep-logo-icon">
  <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%' }} />
</div>          <span className="ep-logo-text">
            Uni<span className="ep-logo-accent">Connect</span>
          </span>
        </div>
        <button className="ep-back-btn">
          <span className="ep-back-arrow">←</span> Back
        </button>
      </nav>

      <div className="ep-container">
        {/* PAGE HEADER */}
        <div className="ep-header">
          <div>
            <h1 className="ep-title">Edit Profile</h1>
            <p className="ep-subtitle">Update your information and manage your account</p>
          </div>
          <div className="ep-header-icon">🎓</div>
        </div>

        {/* ── SECTION 1: Personal Information ── */}
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
                    ? <img src={avatar} alt="avatar" className="ep-avatar-img" />
                    : <div className="ep-avatar-placeholder">AP</div>
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
                  <label className="ep-label">Status</label>
                  <div className="ep-select-wrap">
                    <span className="ep-status-dot" />
                    <select className="ep-select" value={status} onChange={e => setStatus(e.target.value)}>
                      <option>Active</option>
                      <option>Busy</option>
                      <option>Away</option>
                      <option>Offline</option>
                    </select>
                    <svg className="ep-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                <div className="ep-field ep-field--half">
                  <label className="ep-label">Phone Number</label>
                  <div className="ep-input-wrap">
                    <svg className="ep-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <input className="ep-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
              </div>

              <div className="ep-field">
                <label className="ep-label">LinkedIn URL</label>
                <div className="ep-input-wrap">
                  <svg className="ep-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
                  </svg>
                  <input className="ep-input" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
                </div>
              </div>

              <div className="ep-field">
                <label className="ep-label">GitHub URL</label>
                <div className="ep-input-wrap">
                  <svg className="ep-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                  </svg>
                  <input className="ep-input" value={github} onChange={e => setGithub(e.target.value)} placeholder="https://github.com/..." />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: Academic Information ── */}
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

          <div className="ep-field">
            <label className="ep-label">Skills</label>
            <div className="ep-skills-box">
              <input
                className="ep-skills-input"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKey}
                placeholder="Type a skill and press Enter..."
              />
              <div className="ep-tags">
                {skills.map(sk => (
                  <span key={sk} className="ep-tag">
                    {sk}
                    <button className="ep-tag-remove" onClick={() => removeSkill(sk)}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: Security ── */}
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
            <label className="ep-label">Current Password</label>
            <div className="ep-input-wrap">
              <svg className="ep-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input className="ep-input" type={showCurrent ? "text" : "password"} value={currentPass} onChange={e => setCurrentPass(e.target.value)} placeholder="Enter your current password" />
              <button className="ep-eye-btn" onClick={() => setShowCurrent(v => !v)}>
                {showCurrent
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <div className="ep-field">
            <label className="ep-label">New Password</label>
            <div className="ep-input-wrap">
              <svg className="ep-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input className="ep-input" type={showNew ? "text" : "password"} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Enter your new password" />
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
                placeholder="Confirm your new password"
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

        {/* ── SAVE BUTTON ── */}
        <div className="ep-save-bar">
          <button className={`ep-save-btn ${saved ? "ep-save-btn--saved" : ""}`} onClick={handleSave}>
            {saved ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Saved!
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
