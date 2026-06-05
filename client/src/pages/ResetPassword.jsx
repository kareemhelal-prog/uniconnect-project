import "../styles/ResetPassword.css";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Reset Password";
  }, []);

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const handleSave = () => {
    if (newPass && newPass === confirmPass) navigate("/");
  };

  const handleSkip = () => navigate("/");

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
          <p className="subtitle">You can skip or change your password</p>

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

          <button onClick={handleSave}>Change Password</button>
          <button onClick={handleSkip} style={{ marginTop: 10 }}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;