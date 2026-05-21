import "../styles/ForgotPassword.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function ForgotPassword() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Forgot Password";
  }, []);
  const [email, setEmail] = useState("");

  const handleSend = async () => {
    if (email.trim() === "") return;
    
    try {
        const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.success) {
            navigate("/otp-verification", { state: { email } });
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert("Something went wrong. Please try again later.");
    }
};

  return (
    <div className="forgot-page">
      <div className="forgot-content">
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
    </div>
  );
}

export default ForgotPassword;