import "../styles/OtpVerification.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";

function OtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    document.title = "OTP Verification";
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 3) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 4) return setError("Enter the full 4-digit code.");
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/verify-otp", { email, otp: code });
      navigate("/reset-password", { state: { email, otp: code } });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-page">
      <div className="page-bg" />
      <div className="page-overlay" />
      <div className="otp-content">
        <div className="logo-container">
          <img src="/logo.png" className="logo" alt="logo" />
          <h1 className="brand-name">UniConnect</h1>
        </div>

        <div className="card">
          <h2>OTP Verification</h2>
          <p className="subtitle">Enter the code sent to your email</p>

          <div className="otp-boxes">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>

          {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</p>}

          <button onClick={handleVerify} disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OtpVerification;