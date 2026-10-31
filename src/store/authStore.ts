import { create } from 'zustand'
import * as authApi from '../api/authApi'
import { getErrorMessage, tokenStore } from '../api/client'
import type { UserProfile } from '../types/auth'

type AuthState = {
  user: UserProfile | null
  bootstrapped: boolean
  loading: boolean
  error: string | null
  bootstrap: () => Promise<void>
  sendOtp: (mobile: string) => Promise<void>
  verifyOtp: (mobile: string, otp: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  bootstrapped: false,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  bootstrap: async () => {
    if (!tokenStore.getAccess() && !tokenStore.getRefresh()) {
      set({ user: null, bootstrapped: true })
      return
    }
    try {
      const user = await authApi.fetchMe()
      set({ user, bootstrapped: true })
    } catch (e) {
      const status = (e as { status?: number })?.status
      const code = (e as { code?: string })?.code
      // Rate-limit or transient errors must not sign the user out.
      if (status === 429 || code === 'RATE_LIMITED') {
        set({ bootstrapped: true })
        // Retry once shortly — Strict Mode + page reloads can burst /auth/me
        window.setTimeout(() => {
          void get()
            .bootstrap()
            .catch(() => undefined)
        }, 1500)
        return
      }
      if (status === 401 || status === 403) {
        tokenStore.clear()
        set({ user: null, bootstrapped: true })
        return
      }
      // Network / unknown: keep tokens, allow shell to continue
      set({ bootstrapped: true })
    }
  },

  sendOtp: async (mobile) => {
    set({ loading: true, error: null })
    try {
      await authApi.sendOtp(mobile)
      set({ loading: false })
    } catch (e) {
      set({ loading: false, error: getErrorMessage(e) })
      throw e
    }
  },

  verifyOtp: async (mobile, otp) => {
    set({ loading: true, error: null })
    try {
      const tokens = await authApi.verifyOtp(mobile, otp)
      set({ user: tokens.user, loading: false })
    } catch (e) {
      set({ loading: false, error: getErrorMessage(e) })
      throw e
    }
  },

  logout: async () => {
    await authApi.logout()
    set({ user: null })
  },

  hasPermission: (permission) => get().user?.permissions?.includes(permission) ?? false,
  hasRole: (role) => get().user?.roles?.includes(role) ?? false,
}))
