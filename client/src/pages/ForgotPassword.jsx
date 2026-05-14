import "../styles/ForgotPassword.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSend = () => {
    if (email.trim() === "") return;
    navigate("/otp");
  };

  return (
    <div className="container">

      <div className="logo-container">
        <img src="/logo.png" className="logo" />
        <h1 className="brand-name">UniConnect</h1>
      </div>

      <div className="card">
        <h2>Forgot Password</h2>

        <p className="subtitle">
          Enter your email to receive OTP
        </p>

        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <button onClick={handleSend}>
          Send OTP
        </button>
      </div>

    </div>
  );
}

export default ForgotPassword;