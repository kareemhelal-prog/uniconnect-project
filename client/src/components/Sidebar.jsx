import React from "react";
import "./Sidebar.css";

export default function Sidebar() {
  return (
    <footer className="sidebar">
      <span
        className="sidebar-text"
        contentEditable
        suppressContentEditableWarning
      >
        اكتب هنا
      </span>
    </footer>
  );
}
