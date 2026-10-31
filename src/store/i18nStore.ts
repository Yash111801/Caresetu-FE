import { create } from 'zustand'
import { MESSAGES, type Lang } from '../i18n/messages'

type I18nState = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

const KEY = 'caresetu.lang'

export const useI18n = create<I18nState>((set, get) => ({
  lang: (localStorage.getItem(KEY) as Lang) || 'en',
  setLang: (lang) => {
    localStorage.setItem(KEY, lang)
    set({ lang })
  },
  t: (key) => MESSAGES[get().lang][key] || MESSAGES.en[key] || key,
}))
