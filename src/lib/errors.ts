import axios from 'axios'
import type { ErrorResponse } from '../types/auth'

export class AppError extends Error {
  readonly code: string
  readonly status?: number
  readonly fields?: { field: string; message: string }[]
  readonly correlationId?: string

  constructor(
    message: string,
    opts?: {
      code?: string
      status?: number
      fields?: { field: string; message: string }[]
      correlationId?: string
      cause?: unknown
    },
  ) {
    super(message, opts?.cause ? { cause: opts.cause } : undefined)
    this.name = 'AppError'
    this.code = opts?.code ?? 'UNEXPECTED'
    this.status = opts?.status
    this.fields = opts?.fields
    this.correlationId = opts?.correlationId
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (axios.isAxiosError<ErrorResponse>(error)) {
    const data = error.response?.data
    return new AppError(data?.message || error.message || 'Request failed', {
      code: data?.code || 'HTTP_ERROR',
      status: error.response?.status,
      fields: data?.errors,
      correlationId: error.response?.headers?.['x-request-id'] as string | undefined,
      cause: error,
    })
  }
  if (error instanceof Error) {
    return new AppError(error.message, { cause: error })
  }
  return new AppError('Unexpected error')
}

export function getErrorMessage(error: unknown): string {
  return toAppError(error).message
}
