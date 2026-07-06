import { useEffect, useRef, useMemo } from "react";
import "../styles/AuthBackground.css";

/* Activity icons drifting in the background */
function FloatIcon({ kind }) {
  const p = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (kind) {
    case "like":    return <svg {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>;
    case "comment": return <svg {...p}><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 21l1.9-4a8.4 8.4 0 0 1-.9-4 8.5 8.5 0 0 1 17 0z"/></svg>;
    case "chat":    return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg>;
    case "file":    return <svg {...p}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>;
    case "book":    return <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
    case "cap":     return <svg {...p}><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2.5 9 2.5 12 0v-5"/></svg>;
    case "users":   return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "star":    return <svg {...p}><polygon points="12 2 15.1 8.6 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.6 12 2"/></svg>;
    case "bulb":    return <svg {...p}><path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/></svg>;
    case "play":    return <svg {...p}><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>;
    default:        return null;
  }
}

/**
 * Shared animated auth background: mesh + orbs + aurora + drifting activity
 * icons + cursor spotlight. Fixed behind page content (z-index 0).
 */
export default function AuthBackground() {
  const glowRef = useRef(null);

  // Cursor-following spotlight
  useEffect(() => {
    const move = (e) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`;
        glowRef.current.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  const floats = useMemo(() => {
    const kinds = ["like", "comment", "file", "book", "cap", "users", "star", "bulb", "chat", "play"];
    const colors = ["#22d3ee", "#a855f7", "#ec4899", "#38bdf8", "#818cf8"];
    const items = [];
    const cols = 8, rows = 5;
    for (let i = 0; i < cols * rows; i++) {
      if (Math.random() < 0.22) continue;
      const cx = (i % cols) / cols * 100;
      const cy = Math.floor(i / cols) / rows * 100;
      items.push({
        kind: kinds[Math.floor(Math.random() * kinds.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        left: cx + (Math.random() * 8 - 4),
        top: cy + (Math.random() * 12 - 2),
        size: 24 + Math.random() * 28,
        dur: 7 + Math.random() * 7,
        delay: Math.random() * 6,
        opacity: 0.22 + Math.random() * 0.28,
      });
    }
    return items;
  }, []);

  return (
    <div className="auth-bg" aria-hidden="true">
      <div className="auth-bg-grid" />
      <div className="auth-blob auth-blob-blue" />
      <div className="auth-blob auth-blob-purple" />
      <div className="auth-aurora" />
      <div className="auth-floats">
        {floats.map((f, i) => (
          <span
            key={i}
            className="auth-float"
            style={{
              left: `${f.left}%`,
              top: `${f.top}%`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              color: f.color,
              opacity: f.opacity,
              "--dur": `${f.dur}s`,
              "--delay": `${f.delay}s`,
            }}
          >
            <FloatIcon kind={f.kind} />
          </span>
        ))}
      </div>
      <div className="auth-cursor-glow" ref={glowRef} />
    </div>
  );
}
