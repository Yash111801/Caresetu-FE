import { create } from 'zustand'

export type Theme = 'light' | 'dark'
export type TextSize = 'sm' | 'md' | 'lg'

type PrefsState = {
  theme: Theme
  textSize: TextSize
  offline: boolean
  queued: number
  setTheme: (theme: Theme) => void
  setTextSize: (size: TextSize) => void
  setOffline: (offline: boolean) => void
  refreshQueue: () => void
  applyDom: () => void
}

const THEME_KEY = 'caresetu.theme'
const SIZE_KEY = 'caresetu.textSize'
const OFFLINE_KEY = 'caresetu.offline'
const QUEUE_KEY = 'caresetu.offlineQueue'

function readQueueLen() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as unknown[]).length : 0
  } catch {
    return 0
  }
}

function apply(theme: Theme, textSize: TextSize) {
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.setAttribute('data-text', textSize)
  document.documentElement.style.colorScheme = theme
}

export const usePrefs = create<PrefsState>((set, get) => {
  const theme = (localStorage.getItem(THEME_KEY) as Theme) || 'light'
  const textSize = (localStorage.getItem(SIZE_KEY) as TextSize) || 'md'
  const offline = localStorage.getItem(OFFLINE_KEY) === '1'
  apply(theme, textSize)
  return {
    theme,
    textSize,
    offline,
    queued: readQueueLen(),
    setTheme: (next) => {
      localStorage.setItem(THEME_KEY, next)
      apply(next, get().textSize)
      set({ theme: next })
    },
    setTextSize: (next) => {
      localStorage.setItem(SIZE_KEY, next)
      apply(get().theme, next)
      set({ textSize: next })
    },
    setOffline: (next) => {
      localStorage.setItem(OFFLINE_KEY, next ? '1' : '0')
      set({ offline: next })
    },
    refreshQueue: () => set({ queued: readQueueLen() }),
    applyDom: () => apply(get().theme, get().textSize),
  }
})

export type QueuedAction = {
  id: string
  label: string
  path: string
  method: 'POST' | 'GET'
  body?: unknown
  at: string
}

export function enqueueOffline(action: Omit<QueuedAction, 'id' | 'at'>) {
  const raw = localStorage.getItem(QUEUE_KEY)
  const list: QueuedAction[] = raw ? (JSON.parse(raw) as QueuedAction[]) : []
  list.push({
    ...action,
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
  })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(list))
  usePrefs.getState().refreshQueue()
}

export function listOfflineQueue(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as QueuedAction[]) : []
  } catch {
    return []
  }
}

export function clearOfflineQueue() {
  localStorage.removeItem(QUEUE_KEY)
  usePrefs.getState().refreshQueue()
}
