/**
 * Thin fetch wrapper around the Django JSON API.
 *
 * Backend-agnostic on purpose: it handles Django REST Framework style
 * pagination envelopes and DRF error bodies, so swapping the real endpoint
 * implementation never requires touching the UI code.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '')
const AUTH_TOKEN = import.meta.env.VITE_AUTH_TOKEN as string | undefined

export class ApiError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, message: string, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[2]) : null
}

/** Pulls a human-readable message out of a DRF-style error body. */
function extractMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (typeof record.detail === 'string') return record.detail
    if (typeof record.message === 'string') return record.message
    for (const value of Object.values(record)) {
      if (typeof value === 'string') return value
      if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
    }
  }
  return fallback
}

type Body = Record<string, unknown> | unknown[] | FormData | undefined

type RequestOptions = Omit<RequestInit, 'body'> & { body?: Body }

function buildHeaders(hasBody: boolean): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (hasBody) headers['Content-Type'] = 'application/json'
  if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`
  // Django requires the CSRF cookie to be echoed back on unsafe methods.
  const csrf = getCookie('csrftoken')
  if (csrf) headers['X-CSRFToken'] = csrf
  return headers
}

export async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const hasBody = init.body !== undefined
  const isFormData = init.body instanceof FormData
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: { ...buildHeaders(hasBody), ...(init.headers ?? {}) },
    body: hasBody && !isFormData ? JSON.stringify(init.body) : (init.body as BodyInit | undefined),
  })

  if (response.status === 204) return undefined as T

  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractMessage(payload, `Request failed with status ${response.status}`),
      payload,
    )
  }

  return payload as T
}

/** Accepts a bare array, `{results: []}`, or `{count, results}` and returns rows. */
export function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (Array.isArray(record.results)) return record.results as T[]
    if (Array.isArray(record.items)) return record.items as T[]
  }
  return []
}

/** GET with optional query params; empty and falsy values are dropped. */
export function queryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === 'all' || value === false) continue
    if (Array.isArray(value)) {
      if (!value.length) continue
      search.set(key, value.join(','))
    } else {
      search.set(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}