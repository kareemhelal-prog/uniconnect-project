import { useState } from 'react';
import './Register.css';
import profileImg from '../images/image.register.jpeg';
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Register() {
  const navigate = useNavigate()
const [formData, setFormData] = useState({
  fullName: '', email: '', password: '', confirmPass: '',
  username: '', role: 'student'
});
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({  ...errors,   [e.target.name]: '' });
  };

const validate = () => {
  const errs = {};
  if (!formData.fullName.trim())                  errs.fullName    = 'Full name is required.';
  if (!formData.username.trim())                  errs.username    = 'Username is required.';
  if (!formData.email.includes('@'))              errs.email       = 'Enter a valid email.';
  if (formData.password.length < 6)               errs.password    = 'Min 6 characters.';
  if (formData.password !== formData.confirmPass) errs.confirmPass = "Passwords don't match.";
  return errs;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  const errs = validate();
  if (Object.keys(errs).length) { setErrors(errs); return; }
  setLoading(true);
  try {
    await api.post('/auth/register', {
      name: formData.fullName,
      email: formData.email,
      password: formData.password,
      username: formData.username,
      role: formData.role
    });
    navigate('/login');
  } catch (err) {
    const message = err.response?.data?.message || "حصل خطأ، حاول تاني";
    setErrors({ general: message });
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      {/* Animated background — images/bg.png */}
      <div className="page-bg" aria-hidden="true" />
      <div className="page-overlay" aria-hidden="true" />

      <div className="register-page">
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h1 className="register-brand">UniConnect</h1>

          <main className="register-card">
            {/* Profile image — images/image.register.jpeg */}
            <div className="register-img-wrap">
              <img src={profileImg} alt="UniConnect logo" className="register-img" />
            </div>

            <h2 className="register-title">Create Account</h2>

            <form className="register-form" onSubmit={handleSubmit} noValidate>

              <div>
                <label htmlFor="fullName" className="field-label">Full Name</label>
                <input
                  id="fullName" name="fullName" type="text"
                  placeholder="Ahmed Mohamed"
                  value={formData.fullName} onChange={handleChange}
                  className={`register-input ${errors.fullName ? 'error' : ''}`}
                  autoComplete="name" required
                />
                <p className="field-error">{errors.fullName}</p>
              </div>

<div>
  <label htmlFor="username" className="field-label">Username</label>
  <input
    id="username" name="username" type="text"
    placeholder="ahmed123"
    value={formData.username} onChange={handleChange}
    className={`register-input ${errors.username ? 'error' : ''}`}
    required
  />
  <p className="field-error">{errors.username}</p>
</div>

              <div className="register-pw-row">
                <div>
                  <label htmlFor="password" className="field-label">Password</label>
                  <input
                    id="password" name="password" type="password"
                    placeholder="Min 8 chars"
                    value={formData.password} onChange={handleChange}
                    className={`register-input ${errors.password ? 'error' : ''}`}
                    autoComplete="new-password" minLength={8} required
                  />
                  <p className="field-error">{errors.password}</p>
                </div>
                <div>
                  <label htmlFor="confirmPass" className="field-label">Confirm</label>
                  <input
                    id="confirmPass" name="confirmPass" type="password"
                    placeholder="Repeat"
                    value={formData.confirmPass} onChange={handleChange}
                    className={`register-input ${errors.confirmPass ? 'error' : ''}`}
                    autoComplete="new-password" required
                  />
                  <p className="field-error">{errors.confirmPass}</p>
                </div>
              </div>

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? 'Creating account…' : 'Register'}
              </button>

            </form>

<p className="register-footer">
  Already have an account? <a onClick={() => navigate('/login')}>Log in</a>
</p>
          </main>
        </div>
      </div>
    </>
  );
}
