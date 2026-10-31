import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { AppError } from '../lib/errors'
import type { ApiResponse, ErrorResponse, TokenResponse } from '../types/auth'

const ACCESS_KEY = 'caresetu.access'
const REFRESH_KEY = 'caresetu.refresh'
const DEVICE_KEY = 'caresetu.deviceId'

function ensureDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set(tokens: Pick<TokenResponse, 'accessToken' | 'refreshToken'>) {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Device-Id'] = ensureDeviceId()
  config.headers['X-Request-Id'] = crypto.randomUUID()
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefresh()
  if (!refreshToken) return null
  try {
    const { data } = await axios.post<ApiResponse<TokenResponse>>(
      `${api.defaults.baseURL}/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': ensureDeviceId(),
        },
      },
    )
    if (!data.success || !data.data) return null
    tokenStore.set(data.data)
    return data.data.accessToken
  } catch (err) {
    // Only drop the session when the server rejects the refresh token.
    // Network / abort failures must not wipe a still-valid access token.
    const status = (err as AxiosError)?.response?.status
    if (status === 401 || status === 403) {
      tokenStore.clear()
    }
    return null
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ErrorResponse>) => {
    const original = error.config
    const status = error.response?.status
    const data = error.response?.data

    // Refresh on 401 for app APIs and /auth/me. Never for otp/verify/refresh themselves.
    const url = original?.url || ''
    const isAuthMutation =
      url.includes('/auth/otp') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout')
    if (original && status === 401 && !isAuthMutation) {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null
        })
      }
      const newToken = await refreshPromise
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api.request(original)
      }
    }

    return Promise.reject(
      new AppError(data?.message || error.message || 'Request failed', {
        code: data?.code || 'HTTP_ERROR',
        status,
        fields: data?.errors,
        correlationId: (error.response?.headers?.['x-request-id'] as string) || undefined,
        cause: error,
      }),
    )
  },
)

/** @deprecated Prefer AppError / toAppError — kept for existing imports */
export { getErrorMessage } from '../lib/errors'
