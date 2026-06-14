// client/src/pages/EditProfile.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../api/axios.js";
import '../styles/ProfileEdit.css';

function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    phone: '',
    profile_picture: '',
    faculty: '',
    year: '',
    skills: []
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get('/auth/profile');
        if (response.data.success) {
          const u = response.data.user;
          setFormData({
            name: u.name || '',
            username: u.username || '',
            email: u.email || '',
            bio: u.bio || '',
            phone: u.phone || '',
            profile_picture: u.profile_picture || '',
            faculty: u.faculty || '',
            year: u.year || '',
            skills: u.skills
              ? (Array.isArray(u.skills) ? u.skills : u.skills.split(',').map(s => s.trim()))
              : []
          });
        }
      } catch (error) {
        if (error.response?.status === 401) {
          navigate('/login');
        } else {
          setMessage({ text: 'Failed to load profile data', type: 'error' });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      const skill = skillInput.trim();
      if (!formData.skills.includes(skill)) {
        setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await API.put('/auth/profile', formData);
      if (response.data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || 'Failed to save changes',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setMessage({ text: 'Please enter current and new password', type: 'error' });
      return;
    }
    try {
      await API.put('/auth/profile/change-password', passwordData);
      setMessage({ text: 'Password changed successfully', type: 'success' });
      setPasswordData({ currentPassword: '', newPassword: '' });
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || 'Failed to change password',
        type: 'error'
      });
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="ep-page">
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="ep-page">

      {/* NAV */}
      <nav className="ep-nav">
        <div className="ep-logo">
          <div className="ep-logo-icon">U</div>
          <span className="ep-logo-text">Uni<span className="ep-logo-accent">Connect</span></span>
        </div>
        <button className="ep-back-btn" onClick={() => navigate('/profile')}>
          <span className="ep-back-arrow">←</span>
          Back to Profile
        </button>
      </nav>

      <div className="ep-container">

        {/* HEADER */}
        <div className="ep-header">
          <div>
            <h1 className="ep-title">Edit Profile</h1>
            <p className="ep-subtitle">Update your personal and academic information</p>
          </div>
          <span className="ep-header-icon">✏️</span>
        </div>

        {/* MESSAGE */}
        {message.text && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            background: message.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(248,113,113,0.12)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(248,113,113,0.3)'}`,
            color: message.type === 'success' ? '#10b981' : '#f87171'
          }}>
            {message.text}
          </div>
        )}

        {/* PERSONAL INFO */}
        <div className="ep-section">
          <div className="ep-section-header">
            <div className="ep-section-icon">👤</div>
            <div>
              <div className="ep-section-title">Personal Information</div>
              <div className="ep-section-desc">Name, photo, and contact details</div>
            </div>
          </div>

          <div className="ep-personal-grid">

            {/* AVATAR */}
            <div className="ep-avatar-col">
              <div className="ep-avatar-wrap">
                <div className="ep-avatar-ring">
                  {formData.profile_picture ? (
                    <img
                      src={formData.profile_picture}
                      alt="avatar"
                      className="ep-avatar-img"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="ep-avatar-placeholder">
                      {getInitials(formData.name)}
                    </div>
                  )}
                </div>
              </div>
              <span className="ep-avatar-label">Profile Photo</span>
              <span className="ep-avatar-hint">Paste an image URL below</span>
            </div>

            {/* FIELDS */}
            <div className="ep-fields-col">

              <div className="ep-row">
                <div className="ep-field ep-field--half">
                  <label className="ep-label">Full Name</label>
                  <div className="ep-input-wrap">
                    <span className="ep-input-icon">👤</span>
                    <input
                      className="ep-input"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div className="ep-field ep-field--half">
                  <label className="ep-label">Username</label>
                  <div className="ep-input-wrap">
                    <span className="ep-input-icon">@</span>
                    <input
                      className="ep-input"
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="username"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="ep-field">
                <label className="ep-label">Email</label>
                <div className="ep-input-wrap">
                  <span className="ep-input-icon">✉️</span>
                  <input
                    className="ep-input"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="ep-field">
                <label className="ep-label">Phone Number</label>
                <div className="ep-input-wrap">
                  <span className="ep-input-icon">📱</span>
                  <input
                    className="ep-input"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </div>

              <div className="ep-field">
                <label className="ep-label">Profile Picture URL</label>
                <div className="ep-input-wrap">
                  <span className="ep-input-icon">🖼️</span>
                  <input
                    className="ep-input"
                    type="text"
                    name="profile_picture"
                    value={formData.profile_picture}
                    onChange={handleChange}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </div>

              <div className="ep-field">
                <label className="ep-label">Bio</label>
                <div className="ep-textarea-wrap">
                  <span className="ep-input-icon ep-input-icon--top">📝</span>
                  <textarea
                    className="ep-textarea"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Write a short bio about yourself..."
                    rows="3"
                    maxLength={200}
                  />
                </div>
                <span className="ep-char-count">{formData.bio.length} / 200</span>
              </div>

            </div>
          </div>
        </div>

        {/* ACADEMIC INFO */}
        <div className="ep-section ep-section--academic">
          <div className="ep-section-header">
            <div className="ep-section-icon ep-section-icon--academic">🎓</div>
            <div>
              <div className="ep-section-title">Academic Information</div>
              <div className="ep-section-desc">Faculty, study year, and skills</div>
            </div>
          </div>

          <div className="ep-row">
            <div className="ep-field ep-field--grow">
              <label className="ep-label">Faculty / Major</label>
              <div className="ep-input-wrap">
                <span className="ep-input-icon">🏛️</span>
                <input
                  className="ep-input"
                  type="text"
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  placeholder="e.g. Information Technology"
                />
              </div>
            </div>

            <div className="ep-field ep-field--year">
              <label className="ep-label">Study Year</label>
              <div className="ep-select-wrap">
                <span className="ep-input-icon">📅</span>
                <select
                  className="ep-select"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                >
                  <option value="">Select year</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                  <option value="5">Year 5</option>
                </select>
                <span className="ep-select-arrow">▾</span>
              </div>
            </div>
          </div>

          <div className="ep-field">
            <label className="ep-label">Skills</label>
            <div className="ep-skills-box">
              {formData.skills.length > 0 && (
                <div className="ep-tags">
                  {formData.skills.map(skill => (
                    <span key={skill} className="ep-tag">
                      {skill}
                      <button
                        className="ep-tag-remove"
                        onClick={() => handleRemoveSkill(skill)}
                        type="button"
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
              <input
                className="ep-skills-input"
                type="text"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder="Type a skill and press Enter — e.g. React"
              />
            </div>
          </div>
        </div>

        {/* SECURITY */}
        <div className="ep-section ep-section--security">
          <div className="ep-section-header">
            <div className="ep-section-icon ep-section-icon--security">🔐</div>
            <div>
              <div className="ep-section-title">Security</div>
              <div className="ep-section-desc">Change your account password</div>
            </div>
          </div>

          <div className="ep-field">
            <label className="ep-label">Current Password</label>
            <div className="ep-input-wrap">
              <span className="ep-input-icon">🔒</span>
              <input
                className="ep-input"
                type={showPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={e => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="ep-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="ep-field">
            <label className="ep-label">New Password</label>
            <div className="ep-input-wrap">
              <span className="ep-input-icon">🔑</span>
              <input
                className="ep-input"
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={e => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="ep-eye-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleChangePassword}
            style={{
              padding: '11px 24px',
              borderRadius: '10px',
              border: '1px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.1)',
              color: '#10b981',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              alignSelf: 'flex-start'
            }}
          >
            Change Password
          </button>
        </div>

        {/* SAVE BAR */}
        <div className="ep-save-bar">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className={`ep-save-btn ${saved ? 'ep-save-btn--saved' : ''}`}
          >
            {saving ? '⏳ Saving...' : saved ? '✅ Saved!' : '💾 Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default EditProfile;