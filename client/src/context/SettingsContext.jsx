import { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [lang, setLang]   = useState(() => localStorage.getItem("lang") || "en");

  // Apply theme to <html> and persist
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Apply language and persist. NOTE: we intentionally keep the page
  // direction LTR — the app's layouts aren't RTL-ready yet, and flipping
  // `dir` mirrors/breaks every page. Arabic text still renders correctly
  // (Unicode handles bidi). Full RTL is a separate, per-page effort.
  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", "ltr");
    localStorage.setItem("lang", lang);
  }, [lang]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <SettingsContext.Provider value={{ theme, setTheme, toggleTheme, lang, setLang }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  // Safe fallback if a component renders outside the provider
  return ctx || { theme: "dark", setTheme: () => {}, toggleTheme: () => {}, lang: "en", setLang: () => {} };
}
