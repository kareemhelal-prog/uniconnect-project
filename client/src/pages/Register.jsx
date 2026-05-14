import { useState } from "react";
import "../styles/Register.css";
import profileImg from "../assets/image.register.jpeg";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPass: "",
    username: "",
    role: "student",
    doctorYear: "",
    specialization: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = "Full name is required.";
    if (!formData.username.trim()) errs.username = "Username is required.";
    if (!formData.email.includes("@")) errs.email = "Enter a valid email.";
    if (formData.role === "student") {
      if (!formData.doctorYear) errs.doctorYear = "Please select a year.";
      if (!formData.specialization)
        errs.specialization = "Please select a specialization.";
    }
    if (formData.password.length < 7) errs.password = "Min 7 characters.";
    if (formData.password !== formData.confirmPass)
      errs.confirmPass = "Passwords don't match.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        username: formData.username,
        role: formData.role,
        doctorYear: formData.doctorYear,
        specialization: formData.specialization,
      });
      navigate("/login");
    } catch (err) {
      const message =
        err.response?.data?.message || "An error occurred, please try again.";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-bg" aria-hidden="true" />
      <div className="page-overlay" aria-hidden="true" />

      <div className="register-page">
        <div style={{ width: "100%", maxWidth: 380 }}>
          <h1 className="register-brand">UniConnect</h1>

          <main className="register-card">
            <div className="register-img-wrap">
              <img
                src={profileImg}
                alt="UniConnect logo"
                className="register-img"
              />
            </div>

            <h2 className="register-title">Create Account</h2>

            <form className="register-form" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="fullName" className="field-label">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Ahmed Mohamed"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`register-input ${errors.fullName ? "error" : ""}`}
                />
                <p className="field-error">{errors.fullName}</p>
              </div>

              <div>
                <label htmlFor="email" className="field-label">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@mail.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`register-input ${errors.email ? "error" : ""}`}
                />
                <p className="field-error">{errors.email}</p>
              </div>

              <div>
                <label htmlFor="username" className="field-label">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="ahmed123"
                  value={formData.username}
                  onChange={handleChange}
                  className={`register-input ${errors.username ? "error" : ""}`}
                />
                <p className="field-error">{errors.username}</p>
              </div>

              <div>
                <label htmlFor="role" className="field-label">
                  User Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="register-input"
                >
                  <option value="student">Student</option>
                  <option value="doctor">Doctor</option>
                  <option value="investor">Investor</option>
                </select>
              </div>

              {formData.role === "student" && (
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexDirection: "column",
                    padding: "10px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "12px",
                  }}
                >
                  <div>
                    <label htmlFor="doctorYear" className="field-label">
                      Select Year
                    </label>
                    <select
                      id="doctorYear"
                      name="doctorYear"
                      value={formData.doctorYear}
                      onChange={handleChange}
                      className="register-input"
                    >
                      <option value="">-- Select Year --</option>
                      <option value="1">First Year</option>
                      <option value="2">Second Year</option>
                      <option value="3">Third Year</option>
                      <option value="4">Fourth Year</option>
                    </select>
                    <p className="field-error">{errors.doctorYear}</p>
                  </div>
                  <div>
                    <label htmlFor="specialization" className="field-label">
                      Specialization
                    </label>
                    <select
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="register-input"
                    >
                      <option value="">-- Select Specialization --</option>
                      <option value="health">Health Sciences</option>
                      <option value="industry">Industry & Energy</option>
                    </select>
                    <p className="field-error">{errors.specialization}</p>
                  </div>
                </div>
              )}

              <div className="register-pw-row">
                <div>
                  <label htmlFor="password" className="field-label">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min 7 chars"
                    value={formData.password}
                    onChange={handleChange}
                    className={`register-input ${
                      errors.password ? "error" : ""
                    }`}
                  />
                  <p className="field-error">{errors.password}</p>
                </div>
                <div>
                  <label htmlFor="confirmPass" className="field-label">
                    Confirm
                  </label>
                  <input
                    id="confirmPass"
                    name="confirmPass"
                    type="password"
                    placeholder="Repeat"
                    value={formData.confirmPass}
                    onChange={handleChange}
                    className={`register-input ${
                      errors.confirmPass ? "error" : ""
                    }`}
                  />
                  <p className="field-error">{errors.confirmPass}</p>
                </div>
              </div>

              {errors.general && (
                <p className="field-error" style={{ textAlign: "center" }}>
                  {errors.general}
                </p>
              )}

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? "Creating account…" : "Register"}
              </button>
            </form>

            <p className="register-footer">
              Already have an account?{" "}
              <a onClick={() => navigate("/login")}>Log in</a>
            </p>
          </main>
        </div>
      </div>
    </>
  );
}
