const ACCESS_TOKEN_KEY = 'pg_access_token'
const REFRESH_TOKEN_KEY = 'pg_refresh_token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function setStorageItem(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage?.setItem(key, value)
    window.localStorage?.setItem(key, value)
  } catch (error) {
    console.warn('Unable to persist auth token', error)
  }
}

function removeStorageItem(key) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage?.removeItem(key)
    window.localStorage?.removeItem(key)
  } catch (error) {
    console.warn('Unable to clear auth token', error)
  }
}

function readStorageItem(key) {
  if (typeof window === 'undefined') return null
  try {
    return (
      window.sessionStorage?.getItem(key) ||
      window.localStorage?.getItem(key) ||
      null
    )
  } catch (error) {
    console.warn('Unable to read auth token from storage', error)
    return null
  }
}

export function storeAuthTokens({ token, refreshToken }) {
  if (!token) return

  setStorageItem(ACCESS_TOKEN_KEY, token)
  if (refreshToken) {
    setStorageItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

export function clearAuthTokens() {
  removeStorageItem(ACCESS_TOKEN_KEY)
  removeStorageItem(REFRESH_TOKEN_KEY)
}

export function getStoredTokens() {
  const token = readStorageItem(ACCESS_TOKEN_KEY)
  const refreshToken = readStorageItem(REFRESH_TOKEN_KEY)
  return { token, refreshToken }
}

export function getStoredAccessToken() {
  const { token } = getStoredTokens()
  return token || null
}
