export type UserProfile = {
  id: string
  fullName: string
  mobile: string
  facilityCode?: string | null
  phcCode?: string | null
  taluka?: string | null
  district?: string | null
  stateCode?: string | null
  roles: string[]
  permissions: string[]
}

export type TokenResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresInSeconds: number
  user: UserProfile
}

export type SendOtpResponse = {
  mobileMasked: string
  expiresInSeconds: number
  resendCooldownSeconds: number
}

export type ApiResponse<T> = {
  success: boolean
  message?: string | null
  data: T
  timestamp?: string
}

export type ErrorResponse = {
  success: false
  message: string
  code?: string
  errors?: { field: string; message: string }[]
}
