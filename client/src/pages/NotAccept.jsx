import React from "react";
import "../styles/NotAccept.css";

const NotAccept = () => {
  return (
    <div className="not-accept-container">
      <div className="not-accept-box">
        <h1 className="not-accept-title">403</h1>
        <h2 className="not-accept-subtitle">Access Denied</h2>

        <p className="not-accept-text">
          You don’t have permission to access this page.
        </p>

        <a href="/" className="not-accept-button">
          Go Back Home
        </a>
      </div>
    </div>
  );
};

export default NotAccept;