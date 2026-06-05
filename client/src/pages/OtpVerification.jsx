import "../styles/OtpVerification.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function OtpVerification() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "OTP Verification";
  }, []);

  const handleVerify = () => {
    navigate("/reset-password");
  };

  return (
    <div className="otp-page">
      <div className="page-bg" />
      <div className="page-overlay" />
      <div className="otp-content">
        <div className="logo-container">
          <img src="/logo.png" className="logo" />
          <h1 className="brand-name">UniConnect</h1>
        </div>

        <div className="card">
          <h2>OTP Verification</h2>

          <p className="subtitle">
            Enter the code sent to your email
          </p>

          <div className="otp-boxes">
            <input maxLength="1" />
            <input maxLength="1" />
            <input maxLength="1" />
            <input maxLength="1" />
          </div>

          <button onClick={handleVerify}>
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}

export default OtpVerification;