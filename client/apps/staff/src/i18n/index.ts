import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./locales/en"
import ar from "./locales/ar"

const STORAGE_KEY = "lang"
const savedLang = localStorage.getItem(STORAGE_KEY) ?? "ar"

function applyDir(lang: string) {
  document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr")
  document.documentElement.setAttribute("lang", lang)
}

applyDir(savedLang)

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: savedLang,
    fallbackLng: "ar",
    interpolation: {
      escapeValue: false,
    },
  })

i18n.on("languageChanged", (lang) => {
  applyDir(lang)
  localStorage.setItem(STORAGE_KEY, lang)
})

export default i18n
