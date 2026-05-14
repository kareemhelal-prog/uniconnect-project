import React from "react";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <span className="logo-icon">🎓</span>
        <span className="logo-text">UniConnect</span>
      </div>

      <div className="navbar-search">
        <span className="search-icon">🔍</span>
        <input type="text" placeholder="Search..." />
      </div>

      <div className="navbar-icons">
        <button className="icon-btn" title="Apps">⊞</button>
        <button className="icon-btn notif" title="Notifications">
          🔔
          <span className="notif-badge">3</span>
        </button>
        <div className="nav-avatar" title="Kareem Mohamed">K</div>
      </div>
    </nav>
  );
};

export default Navbar;
