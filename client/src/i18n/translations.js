// Lightweight i18n — no external dependency.
// Add keys here and use the useT() hook: const t = useT(); t("settings")

export const translations = {
  en: {
    // settings
    settings: "Settings",
    appearance: "Appearance",
    theme: "Theme",
    dark: "Dark",
    light: "Light",
    language: "Language",
    english: "English",
    arabic: "العربية",
    settingsHint: "These preferences are saved on this device.",
    account: "Account",
    editProfile: "Edit profile",
    editProfileDesc: "Update your name, bio, picture, and password",
    open: "Open",

    // navbar
    home: "Home",
    profile: "Profile",
    logout: "Logout",
    searchUsers: "Search users...",

    // common page bits
    myCourses: "My Courses",
    files: "Files",
    groups: "Groups",
    myGroups: "My Groups",
    reviews: "Reviews",
    search: "Search",
  },

  ar: {
    settings: "الإعدادات",
    appearance: "المظهر",
    theme: "الثيم",
    dark: "غامق",
    light: "فاتح",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
    settingsHint: "التفضيلات دي محفوظة على الجهاز ده.",
    account: "الحساب",
    editProfile: "تعديل الملف الشخصي",
    editProfileDesc: "غيّر اسمك ونبذتك وصورتك وكلمة المرور",
    open: "فتح",

    home: "الرئيسية",
    profile: "الملف الشخصي",
    logout: "تسجيل الخروج",
    searchUsers: "ابحث عن أشخاص...",

    myCourses: "موادي",
    files: "الملفات",
    groups: "المجموعات",
    myGroups: "مجموعاتي",
    reviews: "التقييمات",
    search: "بحث",
  },
};

export function translate(lang, key) {
  return (translations[lang] && translations[lang][key]) || translations.en[key] || key;
}
