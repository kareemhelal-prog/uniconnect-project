import "../styles/ResetPassword.css";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const otp   = location.state?.otp   || "";

  useEffect(() => {
    document.title = "Reset Password";
  }, []);

  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);

  const handleSave = async () => {
    if (!newPass || newPass !== confirmPass)
      return setError("Passwords don't match.");
    if (newPass.length < 7)
      return setError("Min 7 characters.");
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/reset-password", { email, otp, newPassword: newPass });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="page-bg" />
      <div className="page-overlay" />

      <div className="reset-content">
        <div className="logo-container">
          <img src="/logo.png" className="logo" alt="UniConnect logo" />
          <h1 className="brand-name">UniConnect</h1>
        </div>

        <div className="card">
          <h2>Reset Password</h2>
          <p className="subtitle">Enter your new password</p>

          <input
            type="password"
            placeholder="New Password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
          />

          {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 6 }}>{error}</p>}

          <button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;