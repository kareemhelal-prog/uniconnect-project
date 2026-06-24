import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import "../styles/NotFound.css";

const NotFound = () => {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = "Not Found";
}, []);
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="notfound-container">
      <div className="notfound-card">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>Sorry, the page you are looking for does not exist or has been moved.</p>
        <div className="notfound-buttons">
          <Link to="/" className="home-btn">Go Home</Link>
          <button className="back-btn" onClick={handleGoBack}>Go Back</button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;