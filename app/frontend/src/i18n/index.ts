import React, { createContext, useContext, useState, useEffect } from 'react'
import { en } from './en.js'
import { hi } from './hi.js'

export type Language = 'en' | 'hi'

type Translations = typeof en

interface I18nContextType {
  lang: Language
  t: Translations
  setLang: (lang: Language) => void
  toggleLang: () => void
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('samanvaya_lang')
      return saved === 'hi' ? 'hi' : 'en'
    } catch {
      return 'en'
    }
  })

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    try {
      localStorage.setItem('samanvaya_lang', newLang)
    } catch {
      // ignore storage error
    }
  }

  const toggleLang = () => {
    setLang(lang === 'en' ? 'hi' : 'en')
  }

  const t = lang === 'hi' ? (hi as unknown as Translations) : en

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return React.createElement(
    I18nContext.Provider,
    { value: { lang, t, setLang, toggleLang } },
    children
  )
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    // Fallback if rendered outside provider
    return {
      lang: 'en' as Language,
      t: en,
      setLang: () => {},
      toggleLang: () => {},
    }
  }
  return ctx
}

