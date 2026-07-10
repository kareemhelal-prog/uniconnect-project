import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useSettings } from "../context/SettingsContext";
import { useT } from "../i18n/useT";
import "../styles/SettingsPage.css";

const SunIcon = (p) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const MoonIcon = (p) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

const SettingsPage = () => {
  const navigate = useNavigate();
  const { theme, setTheme, lang, setLang } = useSettings();
  const t = useT();

  useEffect(() => { document.title = `${t("settings")} | UniConnect`; }, [t]);

  return (
    <div className="settings-page">
      <div className="settings-navbar-wrap"><Navbar /></div>

      <div className="settings-content">
        <h1 className="settings-title">{t("settings")}</h1>
        <p className="settings-hint">{t("settingsHint")}</p>

        {/* Account — the previous settings (profile / password) */}
        <section className="settings-card">
          <h2 className="settings-card-title">{t("account")}</h2>
          <button className="settings-link-row" onClick={() => navigate("/profile/edit")}>
            <span className="settings-link-text">
              <span className="settings-label">{t("editProfile")}</span>
              <span className="settings-link-desc">{t("editProfileDesc")}</span>
            </span>
            <span className="settings-link-arrow">›</span>
          </button>
        </section>

        {/* Theme */}
        <section className="settings-card">
          <h2 className="settings-card-title">{t("appearance")}</h2>
          <div className="settings-row">
            <span className="settings-label">{t("theme")}</span>
            <div className="seg-toggle">
              <button
                className={`seg-btn ${theme === "light" ? "active" : ""}`}
                onClick={() => setTheme("light")}
              >
                <SunIcon width="16" height="16" /> {t("light")}
              </button>
              <button
                className={`seg-btn ${theme === "dark" ? "active" : ""}`}
                onClick={() => setTheme("dark")}
              >
                <MoonIcon width="16" height="16" /> {t("dark")}
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default SettingsPage;
