import React from "react";
import { FiFile } from "react-icons/fi";
import "../styles/PlaceholderPage.css";

export default function FilesPage() {
  return (
    <main className="placeholder-page">
      <div className="placeholder-icon">
        <FiFile />
      </div>
      <h1 className="placeholder-title">Files</h1>
      <p className="placeholder-sub">This page is under construction.</p>
    </main>
  );
}
