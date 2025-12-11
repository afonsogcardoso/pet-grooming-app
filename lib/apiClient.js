const API_BASE = process.env.NEXT_PUBLIC_API_URL

function buildHeaders(token, extra = {}) {
  const headers = { ...extra }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export async function apiGet(path, { token, headers = {} } = {}) {
  if (!API_BASE) return null
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: buildHeaders(token, headers)
  })
  const body = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(body.error || 'Request failed')
  return body
}

export async function apiPost(path, payload, { token, headers = {} } = {}) {
  if (!API_BASE) return null
  const resp = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: buildHeaders(token, { 'Content-Type': 'application/json', ...headers }),
    body: JSON.stringify(payload || {})
  })
  const body = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(body.error || 'Request failed')
  return body
}

export async function apiPatch(path, payload, { token, headers = {} } = {}) {
  if (!API_BASE) return null
  const resp = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: buildHeaders(token, { 'Content-Type': 'application/json', ...headers }),
    body: JSON.stringify(payload || {})
  })
  const body = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(body.error || 'Request failed')
  return body
}

export function hasExternalApi() {
  return Boolean(API_BASE)
}
