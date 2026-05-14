import "../styles/OtpVerification.css";
import { useNavigate } from "react-router-dom";

function OtpVerification() {
  const navigate = useNavigate();

  const handleVerify = () => {
    navigate("/reset");
  };

  return (
    <div className="container">

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
  );
}

export default OtpVerification;