import { useState } from "react";
import { useEffect } from "react";

import "../styles/Register.css";
import profileImg from "../assets/image.register.jpeg";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import GoogleAuthButton from "../components/GoogleAuthButton";

export default function Register() {
  useEffect(() => {
    document.title = "Register | UniConnect";
  }, []);

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPass: "",
    username: "",
    role: "student",
    academicYear: "",
    specialization: "",
    phone: "",
    studentId: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleGoogleToken = async (accessToken) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/google", { access_token: accessToken });
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      // Google sign-ups default to student
      navigate("/Home");
    } catch (err) {
      setErrors({ general: err.response?.data?.message || "Google sign-in failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "studentId") {
      if (!/^\d*$/.test(value) || value.length > 7) {
        return; 
      }
    }

    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const errs = {};
    if (!formData.email.includes("@")) errs.email = "Enter a valid email.";
    
    if (formData.role === "student") {
      if (!formData.username.trim()) errs.username = "Username is required.";
      if (!formData.studentId.trim()) {
        errs.studentId = "Student ID is required.";
      } else if (formData.studentId.length !== 7) {
        errs.studentId = "Student ID must be exactly 7 digits.";
      }
      if (!formData.academicYear) errs.academicYear = "Please select a year.";
      if (!formData.specialization) errs.specialization = "Please select a specialization.";
    }

    if (!formData.phone.trim()) errs.phone = "Phone number is required.";
    if (formData.password.length < 7) errs.password = "Min 7 characters.";
    if (formData.password !== formData.confirmPass) errs.confirmPass = "Passwords don't match.";
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

    const requestData = {
      email: formData.email,
      password: formData.password,
      role: formData.role,
      phone_number: formData.phone,
    };

    if (formData.role === "student") {
      requestData.username = formData.username;
      requestData.studentId = formData.studentId;
      requestData.academicYear = formData.academicYear;
      requestData.specialization = formData.specialization;
    }

    try {
      await api.post("/auth/register", requestData);
      navigate("/login");
    } catch (err) {
      const message = err.response?.data?.message || "An error occurred, please try again.";
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
        <div className="register-wrapper">
          <h1 className="register-brand">UniConnect</h1>

          <main className="register-card">
            <div className="register-img-wrap">
              <img src={profileImg} alt="UniConnect logo" className="register-img" />
            </div>

            <h2 className="register-title">Create Account</h2>

            <form className="register-form" onSubmit={handleSubmit} noValidate>
              
              <div>
                <label htmlFor="email" className="field-label">Email Address</label>
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
                <label htmlFor="phone" className="field-label">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`register-input ${errors.phone ? "error" : ""}`}
                />
                <p className="field-error">{errors.phone}</p>
              </div>

              <div>
                <label htmlFor="role" className="field-label">User Role</label>
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
                <div className="student-fields">
                  
                  <div style={{ gridColumn: "span 2" }}>
                    <label htmlFor="username" className="field-label">Username</label>
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

                  <div style={{ gridColumn: "span 2" }}>
                    <label htmlFor="studentId" className="field-label">Student ID</label>
                    <input
                      id="studentId"
                      name="studentId"
                      type="text"
                      maxLength={7}
                      placeholder="Enter 7-digit ID"
                      value={formData.studentId}
                      onChange={handleChange}
                      className={`register-input ${errors.studentId ? "error" : ""}`}
                    />
                    <p className="field-error">{errors.studentId}</p>
                  </div>

                  <div>
                    <label htmlFor="academicYear" className="field-label">Select Year</label>
                    <select
                      id="academicYear"
                      name="academicYear"
                      value={formData.academicYear}
                      onChange={handleChange}
                      className="register-input"
                    >
                      <option value="">-- Select Year --</option>
                      <option value="1">First Year</option>
                      <option value="2">Second Year</option>
                      <option value="3">Third Year</option>
                      <option value="4">Fourth Year</option>
                    </select>
                    <p className="field-error">{errors.academicYear}</p>
                  </div>
                  <div>
                    <label htmlFor="specialization" className="field-label">Specialization</label>
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
                  <label htmlFor="password" className="field-label">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min 7 chars"
                    value={formData.password}
                    onChange={handleChange}
                    className={`register-input ${errors.password ? "error" : ""}`}
                  />
                  <p className="field-error">{errors.password}</p>
                </div>
                <div>
                  <label htmlFor="confirmPass" className="field-label">Confirm</label>
                  <input
                    id="confirmPass"
                    name="confirmPass"
                    type="password"
                    placeholder="Repeat"
                    value={formData.confirmPass}
                    onChange={handleChange}
                    className={`register-input ${errors.confirmPass ? "error" : ""}`}
                  />
                  <p className="field-error">{errors.confirmPass}</p>
                </div>
              </div>

              {errors.general && (
                <p className="field-error general-error">{errors.general}</p>
              )}

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? "Creating account…" : "Register"}
              </button>
            </form>

            <div className="auth-divider">OR</div>

            <GoogleAuthButton onToken={handleGoogleToken} disabled={loading} />

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