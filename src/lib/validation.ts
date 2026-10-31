export type FieldErrors = Record<string, string>

export function requireText(value: string, label: string, min = 2): string | null {
  const v = value.trim()
  if (!v) return `${label} is required`
  if (v.length < min) return `${label} must be at least ${min} characters`
  return null
}

export function requireAge(value: number | '' | null | undefined): string | null {
  if (value === '' || value == null) return 'Age is required'
  if (!Number.isFinite(value) || value < 1 || value > 120) return 'Enter a valid age (1–120)'
  return null
}

export function optionalMobile(value: string): string | null {
  if (!value) return null
  if (!/^[6-9]\d{9}$/.test(value)) return 'Enter a valid 10-digit Indian mobile'
  return null
}

export function requireMobile(value: string): string | null {
  if (!value) return 'Mobile number is required'
  return optionalMobile(value)
}

export function requireOtp(value: string): string | null {
  if (!/^\d{6}$/.test(value)) return 'Enter the 6-digit OTP'
  return null
}

export function firstError(errors: FieldErrors): string | null {
  const key = Object.keys(errors)[0]
  return key ? errors[key] : null
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0
}
