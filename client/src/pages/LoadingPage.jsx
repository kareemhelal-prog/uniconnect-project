import React from 'react';
import '../styles/LoadingPage.css';
import { useEffect } from "react";

const UniConnectLoader = () => {
  useEffect(() => {
    document.title = "Loading...";
}, []);
  return (
    <div className="uniconnect-loader-overlay">
      <div className="loader-central-unit">
        {/* الدوائر النيون المتداخلة (بطل المشهد) */}
        <div className="neon-ring ring-cyan"></div>
        <div className="neon-ring ring-purple"></div>
        <div className="neon-ring ring-blue"></div>
        
        {/* منطقة النصوص تحت الدوائر */}
        <div className="loader-status-container">
          <div className="loading-text-wrapper">
            <span className="main-loading-text">Loading</span>
            <div className="jumping-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniConnectLoader;