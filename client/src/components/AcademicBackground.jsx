// AcademicBackground.jsx
// Reusable animated background: floating academic doodles with mouse parallax.
// Drop it in as the first child of a page wrapper that has `isolation: isolate`.
import React, { useEffect, useRef } from 'react';
import './AcademicBackground.css';

const AcademicBackground = () => {
  const ref = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    let frame = null;
    const onMove = (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        if (!ref.current) return;
        const dx = (e.clientX / window.innerWidth - 0.5) * -28;
        const dy = (e.clientY / window.innerHeight - 0.5) * -28;
        ref.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      });
    };

    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="academic-bg" aria-hidden="true" ref={ref}>
      <svg className="academic-doodle ad1" viewBox="0 0 64 64" width="70" height="70"><path d="M10 14c8-4 18-4 22 0 4-4 14-4 22 0v40c-8-4-18-4-22 0-4-4-14-4-22 0z" fill="none" stroke="currentColor" strokeWidth="2.5"/><path d="M32 14v40" stroke="currentColor" strokeWidth="2.5"/></svg>
      <svg className="academic-doodle ad2" viewBox="0 0 64 64" width="58" height="58"><path d="M48 8l8 8-32 32-10 2 2-10z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="M42 14l8 8" stroke="currentColor" strokeWidth="2.5"/></svg>
      <svg className="academic-doodle ad3" viewBox="0 0 64 64" width="60" height="60"><rect x="14" y="8" width="36" height="48" rx="3" fill="none" stroke="currentColor" strokeWidth="2.5"/><path d="M22 20h20M22 30h20M22 40h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
      <svg className="academic-doodle ad4" viewBox="0 0 64 64" width="72" height="72"><path d="M4 24 32 12l28 12-28 12z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="M16 30v12c0 4 32 4 32 0V30" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg>
      <svg className="academic-doodle ad5" viewBox="0 0 64 64" width="52" height="52"><path d="M24 44a14 14 0 1 1 16 0c-2 2-3 4-3 7H27c0-3-1-5-3-7z" fill="none" stroke="currentColor" strokeWidth="2.5"/><path d="M26 56h12M28 60h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
      <svg className="academic-doodle ad6" viewBox="0 0 64 64" width="60" height="60"><rect x="6" y="20" width="52" height="20" rx="3" transform="rotate(20 32 30)" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg>
      <svg className="academic-doodle ad7" viewBox="0 0 64 64" width="64" height="64"><rect x="12" y="14" width="40" height="36" rx="3" fill="none" stroke="currentColor" strokeWidth="2.5"/><path d="M20 24h10M20 32h10M34 24h10M34 32h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
      <svg className="academic-doodle ad8" viewBox="0 0 64 64" width="50" height="50"><path d="M16 48l4-12 24-24 8 8-24 24z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/></svg>
    </div>
  );
};

export default AcademicBackground;
