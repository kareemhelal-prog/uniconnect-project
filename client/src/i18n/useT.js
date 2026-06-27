import { useSettings } from "../context/SettingsContext";
import { translate } from "./translations";

// Returns a translator bound to the current language: const t = useT();
export function useT() {
  const { lang } = useSettings();
  return (key) => translate(lang, key);
}
