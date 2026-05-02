import React from "react";

const RegisterForm = () => {
  return (
    <form className="glass-container">
      <h2>Create Account</h2>
      <input type="text" placeholder="Full Name" required />
      <input type="email" placeholder="University Email" required />
      <input type="password" placeholder="Password" required />
      <input type="password" placeholder="Confirm Password" required />
      <button type="submit">REGISTER</button>
    </form>
  );
};

export default RegisterForm;