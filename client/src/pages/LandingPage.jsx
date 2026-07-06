import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/LandingPage.css";

/* ─── Inline SVG icons ─── */
const Icon = {
  users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  book: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  layers: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  file: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
    </svg>
  ),
  star: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  rocket: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  trending: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  arrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

/* ─── Animated counter hook ─── */
function useCounter(target, duration = 2000, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return count;
}

/* ─── Stat card ─── */
function StatCard({ value, suffix = "", label, active }) {
  const count = useCounter(value, 2200, active);
  return (
    <div className="lp-stat">
      <span className="lp-stat-num">{count.toLocaleString()}{suffix}</span>
      <span className="lp-stat-label">{label}</span>
    </div>
  );
}

/* ─── Feature card with 3D tilt ─── */
function FeatureCard({ icon: Ico, title, desc, delay }) {
  const ref = useRef(null);
  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    ref.current.style.transform = `perspective(600px) rotateY(${x / 18}deg) rotateX(${-y / 18}deg) scale(1.03)`;
  };
  const handleLeave = () => {
    ref.current.style.transform = "perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)";
  };
  return (
    <div
      ref={ref}
      className="lp-feat-card lp-reveal"
      style={{ "--delay": `${delay}ms` }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="lp-feat-icon"><Ico /></div>
      <h3 className="lp-feat-title">{title}</h3>
      <p className="lp-feat-desc">{desc}</p>
    </div>
  );
}

/* ─── Role card ─── */
function RoleCard({ gradient, title, tag, items, delay }) {
  return (
    <div className="lp-role-card lp-reveal" style={{ "--delay": `${delay}ms`, "--role-grad": gradient }}>
      <div className="lp-role-glow" />
      <span className="lp-role-tag">{tag}</span>
      <h3 className="lp-role-title">{title}</h3>
      <ul className="lp-role-list">
        {items.map((item, i) => (
          <li key={i}><span className="lp-check"><Icon.check /></span>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const glowRef = useRef(null);
  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const [statsActive, setStatsActive] = useState(false);

  /* Mouse spotlight glow */
  useEffect(() => {
    const move = (e) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`;
        glowRef.current.style.top = `${e.clientY}px`;
      }
      /* Parallax orbs */
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      if (orb1Ref.current) {
        orb1Ref.current.style.transform = `translate(${dx * 40}px, ${dy * 30}px)`;
      }
      if (orb2Ref.current) {
        orb2Ref.current.style.transform = `translate(${-dx * 55}px, ${-dy * 40}px)`;
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  /* Scroll reveal + stats counter trigger */
  useEffect(() => {
    const reveals = document.querySelectorAll(".lp-reveal");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("lp-visible")),
      { threshold: 0.12 }
    );
    reveals.forEach((el) => obs.observe(el));

    const statsObs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsActive(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) statsObs.observe(statsRef.current);

    return () => { obs.disconnect(); statsObs.disconnect(); };
  }, []);

  /* Hero text cycling */
  const words = ["Students", "Academics", "Innovators", "Investors"];
  const [wordIdx, setWordIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setWordIdx((i) => (i + 1) % words.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="lp-root" ref={pageRef}>
      {/* Cursor glow */}
      <div className="lp-cursor-glow" ref={glowRef} />

      {/* Animated background */}
      <div className="lp-bg">
        <div className="lp-mesh" />
        <div className="lp-orb lp-orb-1" ref={orb1Ref} />
        <div className="lp-orb lp-orb-2" ref={orb2Ref} />
        <div className="lp-orb lp-orb-3" />
        <div className="lp-grid-overlay" />
      </div>

      {/* ── Navbar ─────────────────────────────────── */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <div className="lp-logo" onClick={() => navigate("/")}>
            <span className="lp-logo-mark">
              <img src={logo} alt="UniConnect" className="lp-logo-img" />
            </span>
            <span className="lp-logo-text">UniConnect</span>
          </div>
          <nav className="lp-nav-links">
            <a href="#features" className="lp-nav-link">Features</a>
            <a href="#roles" className="lp-nav-link">Who's it for</a>
            <a href="#stats" className="lp-nav-link">Impact</a>
          </nav>
          <div className="lp-header-cta">
            <button className="lp-btn-ghost" onClick={() => navigate("/login")}>Sign In</button>
            <button className="lp-btn-primary" onClick={() => navigate("/register")}>Get Started</button>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="lp-hero" ref={heroRef}>
        <div className="lp-hero-inner">
          <div className="lp-hero-badge lp-reveal">Academic Social Platform</div>
          <h1 className="lp-hero-title lp-reveal" style={{ "--delay": "100ms" }}>
            The Network Built for
            <br />
            <span className="lp-hero-cycle" key={wordIdx}>{words[wordIdx]}</span>
          </h1>
          <p className="lp-hero-sub lp-reveal" style={{ "--delay": "200ms" }}>
            UniConnect brings students, doctors, and investors together in one
            academic space — share knowledge, collaborate on projects, and grow
            your academic network.
          </p>
          <div className="lp-hero-actions lp-reveal" style={{ "--delay": "300ms" }}>
            <button className="lp-btn-hero-primary" onClick={() => navigate("/register")}>
              Join UniConnect <Icon.arrowRight />
            </button>
            <button className="lp-btn-hero-ghost" onClick={() => navigate("/login")}>
              Sign in to your account
            </button>
          </div>
          {/* Floating UI preview cards */}
          <div className="lp-hero-float lp-reveal" style={{ "--delay": "400ms" }}>
            <div className="lp-float-card lp-fc-1">
              <span className="lp-fc-dot green" />
              <span>New academic post shared</span>
            </div>
            <div className="lp-float-card lp-fc-2">
              <span className="lp-fc-dot blue" />
              <span>Dr. Ahmed reviewed your project</span>
            </div>
            <div className="lp-float-card lp-fc-3">
              <span className="lp-fc-dot purple" />
              <span>3 new followers this week</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="lp-scroll-hint">
          <div className="lp-scroll-mouse"><div className="lp-scroll-wheel" /></div>
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────── */}
      <section className="lp-stats-section" id="stats" ref={statsRef}>
        <div className="lp-stats-inner">
          <StatCard value={5000}  suffix="+"  label="Active Students"    active={statsActive} />
          <div className="lp-stats-divider" />
          <StatCard value={320}   suffix="+"  label="Academic Groups"    active={statsActive} />
          <div className="lp-stats-divider" />
          <StatCard value={12000} suffix="+"  label="Files Shared"       active={statsActive} />
          <div className="lp-stats-divider" />
          <StatCard value={98}    suffix="%"  label="User Satisfaction"  active={statsActive} />
        </div>
      </section>

      {/* ── Features ────────────────────────────────── */}
      <section className="lp-features" id="features">
        <div className="lp-section-head lp-reveal">
          <span className="lp-section-tag">What you get</span>
          <h2 className="lp-section-title">Everything your academic life needs</h2>
          <p className="lp-section-sub">
            A complete platform designed around real academic workflows — not a generic social network.
          </p>
        </div>
        <div className="lp-feat-grid">
          <FeatureCard delay={0}   icon={Icon.users}   title="Connect & Follow"      desc="Build your academic network. Follow students, doctors, and researchers whose work inspires you." />
          <FeatureCard delay={80}  icon={Icon.book}    title="Academic Reviews"       desc="Access peer-reviewed material and professional feedback from verified academic doctors." />
          <FeatureCard delay={160} icon={Icon.layers}  title="Study Groups"          desc="Create or join groups by field, course, or project. Collaborate and stay organized together." />
          <FeatureCard delay={240} icon={Icon.file}    title="File Sharing"          desc="Upload, download, and rate academic files. Everything stays organized by category and relevance." />
          <FeatureCard delay={320} icon={Icon.rocket}  title="Projects & Innovation" desc="Investors discover student projects. Students get visibility. Ideas find the right audience." />
          <FeatureCard delay={400} icon={Icon.shield}  title="Verified Academics"    desc="Doctor and investor accounts are verified, ensuring trustworthy content and authentic connections." />
        </div>
      </section>

      {/* ── Who is it for ───────────────────────────── */}
      <section className="lp-roles" id="roles">
        <div className="lp-section-head lp-reveal">
          <span className="lp-section-tag">Made for everyone</span>
          <h2 className="lp-section-title">One platform, three roles</h2>
        </div>
        <div className="lp-roles-grid">
          <RoleCard
            delay={0}
            gradient="linear-gradient(135deg, #6366f1, #818cf8)"
            title="Students"
            tag="For Students"
            items={["Share posts and academic content", "Follow doctors and peers", "Join study groups", "Access and upload files", "Enroll in courses"]}
          />
          <RoleCard
            delay={120}
            gradient="linear-gradient(135deg, #06b6d4, #22d3ee)"
            title="Doctors & Academics"
            tag="For Academics"
            items={["Publish academic reviews", "Mentor and guide students", "Create and manage groups", "Share research materials", "Build a professional profile"]}
          />
          <RoleCard
            delay={240}
            gradient="linear-gradient(135deg, #a855f7, #c084fc)"
            title="Investors"
            tag="For Investors"
            items={["Discover innovative student projects", "Connect with talented students", "Follow academic trends", "Support academic initiatives", "Network with universities"]}
          />
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────── */}
      <section className="lp-cta">
        <div className="lp-cta-glow-1" />
        <div className="lp-cta-glow-2" />
        <div className="lp-cta-inner lp-reveal">
          <div className="lp-cta-icon"><Icon.trending /></div>
          <h2 className="lp-cta-title">Ready to join the academic network?</h2>
          <p className="lp-cta-sub">
            Thousands of students and academics are already connected. Your next collaboration is one click away.
          </p>
          <div className="lp-cta-actions">
            <button className="lp-btn-hero-primary" onClick={() => navigate("/register")}>
              Create Free Account <Icon.arrowRight />
            </button>
            <button className="lp-btn-hero-ghost" onClick={() => navigate("/login")}>
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-logo">
            <div className="lp-logo-mark">
              <img src="/logo.png" alt="" className="lp-logo-img" onError={(e) => { e.target.style.display = "none"; }} />
              <span className="lp-logo-fallback">U</span>
            </div>
            <span className="lp-logo-text">UniConnect</span>
          </div>
          <p className="lp-footer-copy">© 2026 UniConnect. Built for academia.</p>
          <div className="lp-footer-links">
            <button onClick={() => navigate("/login")}>Sign In</button>
            <button onClick={() => navigate("/register")}>Register</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
