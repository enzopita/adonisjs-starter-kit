import type { TuyauError } from '@tuyau/core/client'
import { t } from '@/features/core/i18n'

/** Codes the API returns for expected failures: exceptions send `code`, the tenant middleware sends `key`. */
const API_ERROR_CODES = [
  'E_ROLE_IN_USE',
  'E_LAST_MANAGER',
  'E_ALREADY_MEMBER',
  'E_INVITATION_NOT_FOUND',
  'E_INVITATION_EMAIL_MISMATCH',
  'E_MEMBER_NOT_FOUND',
  'E_TENANT_ACCESS_DENIED',
  'E_TENANT_SUSPENDED',
  'E_INVALID_TENANT_HEADER',
  'E_INVALID_ATTACHMENT',
] as const

export type ApiErrorCode = (typeof API_ERROR_CODES)[number]

const KNOWN_CODES = new Set<string>(API_ERROR_CODES)

/**
 * Every error body the backend sends, merged: exceptions, the tenant middleware, and validation.
 * Its messages are already in the locale the request's Accept-Language asked for.
 */
type ApiErrorBody = {
  message?: string
  code?: string
  key?: string
  errors?: { field?: string; message: string }[]
}

/** What a form shows for a failed submit, in the shape TanStack Form's error map takes. */
export type FormErrors = {
  /** First message per field name, from a 422. */
  fields: Record<string, string>
  /** A message for the whole form, when the error isn't about one field. */
  form?: string
}

function errorBody(error: TuyauError): ApiErrorBody {
  // SAFETY: every non-2xx body this API sends is one of the shapes ApiErrorBody merges.
  return (error.response ?? {}) as ApiErrorBody
}

function isKnownCode(code: string): code is ApiErrorCode {
  return KNOWN_CODES.has(code)
}

export function apiErrorCode(error: TuyauError): ApiErrorCode | null {
  const { code, key } = errorBody(error)
  const value = code ?? key

  return value !== undefined && isKnownCode(value) ? value : null
}

export function errorMessage(error: TuyauError): string {
  if (error.kind === 'network') return t('core.errors.network')

  const body = errorBody(error)

  return body.errors?.[0]?.message ?? body.message ?? t('core.errors.fallback')
}

export function formErrors(error: TuyauError): FormErrors {
  const fields: Record<string, string> = {}

  if (error.status === 422) {
    for (const { field, message } of errorBody(error).errors ?? []) {
      if (field !== undefined && !(field in fields)) fields[field] = message
    }
  }

  return Object.keys(fields).length > 0 ? { fields } : { fields, form: errorMessage(error) }
}
