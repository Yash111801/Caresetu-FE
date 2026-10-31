import { api, tokenStore } from './client'
import type { ApiResponse, SendOtpResponse, TokenResponse, UserProfile } from '../types/auth'

function ensureDeviceId(): string {
  const key = 'caresetu.deviceId'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export async function sendOtp(mobile: string) {
  const { data } = await api.post<ApiResponse<SendOtpResponse>>('/auth/otp/send', { mobile })
  return data.data
}

export async function verifyOtp(mobile: string, otp: string) {
  const { data } = await api.post<ApiResponse<TokenResponse>>('/auth/otp/verify', {
    mobile,
    otp,
    deviceId: ensureDeviceId(),
  })
  tokenStore.set(data.data)
  return data.data
}

export async function fetchMe() {
  const { data } = await api.get<ApiResponse<UserProfile>>('/auth/me')
  return data.data
}

export async function logout() {
  const refreshToken = tokenStore.getRefresh()
  try {
    await api.post('/auth/logout', refreshToken ? { refreshToken } : {})
  } finally {
    tokenStore.clear()
  }
}
