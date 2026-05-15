import "../styles/ResetPassword.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function ResetPassword() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Reset Password";
  }, []);

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const handleSave = () => {
    if (newPass === confirmPass && newPass !== "") {
      navigate("/");
    }
  };

  const handleSkip = () => {
    navigate("/");
  };

  return (
    <div className="reset-page">
      <div className="reset-content">
      <div className="logo-container">
        <img src="/logo.png" className="logo" />
        <h1 className="brand-name">UniConnect</h1>
      </div>

      <div className="card">

        <h2>Reset Password</h2>

        <p className="subtitle">
          You can skip or change your password
        </p>

        <input
          type="password"
          placeholder="New Password"
          onChange={(e) => setNewPass(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          onChange={(e) => setConfirmPass(e.target.value)}
        />

        <button onClick={handleSave}>
          Change Password
        </button>

        <button onClick={handleSkip} style={{ marginTop: "10px" }}>
          Skip
        </button>

      </div>
      </div>
    </div>
  );
}

export default ResetPassword;