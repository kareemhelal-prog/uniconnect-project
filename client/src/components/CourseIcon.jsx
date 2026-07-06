import React from "react";

// =====================================================================
// COURSE VISUAL IDENTITY
// =====================================================================
// Maps a course to an expressive icon + gradient derived from the subject,
// so every course card is visually distinctive of what it teaches. Purely
// presentational (no emoji — inline SVG only, matching the app's style).
// =====================================================================

// Ordered rules: first keyword match wins. Keep the more specific subjects
// (security, IoT, networks) ABOVE the generic "programming" catch-all.
const RULES = [
  { cat: "security", c1: "#f43f5e", c2: "#e11d48", kw: ["cyber", "security", "encryption", "cryptograph"] },
  { cat: "iot",      c1: "#22d3ee", c2: "#0891b2", kw: ["iot", "internet of things", "connecting things", "embedded", "robotic", "signal"] },
  { cat: "network",  c1: "#3b82f6", c2: "#2563eb", kw: ["ccna", "ccnp", "network", "data communication", "server", "distributed", "administration"] },
  { cat: "ai",       c1: "#10b981", c2: "#059669", kw: ["artificial intelligence", "machine learning", "big data", "analytics"] },
  { cat: "database", c1: "#f59e0b", c2: "#d97706", kw: ["database", "db", "sql"] },
  { cat: "web",      c1: "#8b5cf6", c2: "#7c3aed", kw: ["web", "mobile", "windows programming", "graphics"] },
  { cat: "hardware", c1: "#fb923c", c2: "#ea580c", kw: ["microprocessor", "architecture", "digital engineering", "operating system", "linux", "physics"] },
  { cat: "math",     c1: "#ec4899", c2: "#db2777", kw: ["math", "algorithm", "data structure", "discrete"] },
  { cat: "business", c1: "#14b8a6", c2: "#0d9488", kw: ["entrepreneur", "capstone", "graduation", "english", "office", "essentials"] },
  { cat: "code",     c1: "#6366f1", c2: "#4f46e5", kw: ["programming", "python", "java", "c++", "software engineering", "in c"] },
];

const DEFAULT_VIS = { cat: "book", c1: "#64748b", c2: "#475569" };

export function courseVisual(course = {}) {
  const hay = `${course.title || ""} ${course.course_code || ""}`.toLowerCase();
  for (const r of RULES) {
    if (r.kw.some((k) => hay.includes(k))) return r;
  }
  return DEFAULT_VIS;
}

// Inline SVG glyph per category (24x24, stroke = currentColor).
const GLYPHS = {
  security: <><path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5z" /><path d="m9 12 2 2 4-4" /></>,
  iot:      <><circle cx="12" cy="12" r="2.5" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M7.5 16.5 5 19" /></>,
  network:  <><rect x="9" y="2" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" /><rect x="16" y="16" width="6" height="6" rx="1" /><path d="M12 8v4M12 12H5v4M12 12h7v4" /></>,
  ai:       <><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /><circle cx="12" cy="12" r="1.6" /></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
  web:      <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 9h20M6 6.5h.01M9 6.5h.01" /></>,
  hardware: <><rect x="6" y="6" width="12" height="12" rx="1.5" /><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></>,
  math:     <><path d="M5 4h14L11 12l8 8H5" /></>,
  business: <><path d="M4 7h16v13H4z" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 12h16" /></>,
  code:     <><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 5l-2 14" /></>,
  book:     <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
};

export default function CourseIcon({ course, size = 24, className }) {
  const vis = courseVisual(course);
  return (
    <svg
      className={className}
      viewBox="0 0 24 24" width={size} height={size}
      fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
    >
      {GLYPHS[vis.cat] || GLYPHS.book}
    </svg>
  );
}
