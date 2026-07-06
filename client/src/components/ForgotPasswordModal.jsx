import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import GoogleAuthButton from "./GoogleAuthButton";
import "./ForgotPasswordModal.css";

/**
 * Forgot-password modal with two paths:
 *   1) Reset via Google — Google popup verifies identity, then user sets a new password.
 *   2) Reset via Email  — go to the existing OTP email flow (/forgot-password).
 */
export default function ForgotPasswordModal({ onClose }) {
  const navigate = useNavigate();
  const [step, setStep]       = useState("choose"); // choose | setPassword
  const [googleToken, setGoogleToken] = useState(null);
  const [newPass, setNewPass]     = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState(null);

  const showMsg = (text, type) => setMsg({ text, type });

  const handleGoogleToken = (accessToken) => {
    setGoogleToken(accessToken);
    setStep("setPassword");
    setMsg(null);
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (newPass.length < 7) return showMsg("Password must be at least 7 characters", "error");
    if (newPass !== confirm) return showMsg("Passwords do not match", "error");

    setLoading(true);
    try {
      await api.post("/auth/google/reset", { access_token: googleToken, newPassword: newPass });
      showMsg("Password reset! Redirecting to login…", "success");
      setTimeout(() => { onClose(); navigate("/login"); }, 1500);
    } catch (err) {
      showMsg(err.response?.data?.message || "Reset failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fpm-overlay" onClick={onClose}>
      <div className="fpm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="fpm-close" onClick={onClose} aria-label="Close">✕</button>

        {step === "choose" && (
          <>
            <h3 className="fpm-title">Reset your password</h3>
            <p className="fpm-sub">Choose how you'd like to verify your identity.</p>

            <GoogleAuthButton
              onToken={handleGoogleToken}
              onError={() => showMsg("Google sign-in was cancelled", "error")}
              label="Reset with Google"
            />

            <div className="fpm-divider"><span>OR</span></div>

            <button
              className="fpm-email-btn"
              onClick={() => { onClose(); navigate("/forgot-password"); }}
            >
              ✉️ Reset with Email (OTP)
            </button>
          </>
        )}

        {step === "setPassword" && (
          <>
            <h3 className="fpm-title">Set a new password</h3>
            <p className="fpm-sub">Identity verified with Google. Enter your new password.</p>

            <form onSubmit={handleSetPassword} className="fpm-form">
              <input
                type="password"
                className="fpm-input"
                placeholder="New password (min 7 chars)"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
              <input
                type="password"
                className="fpm-input"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <button type="submit" className="fpm-submit" disabled={loading}>
                {loading ? "Saving…" : "Set Password"}
              </button>
            </form>
          </>
        )}

        {msg && <div className={`fpm-msg fpm-msg-${msg.type}`}>{msg.text}</div>}
      </div>
    </div>
  );
}
