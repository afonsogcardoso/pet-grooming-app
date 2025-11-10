// ============================================
// FILE: lib/accountHelpers.js
// Helpers to manage the active account_id for Supabase queries
// ============================================

import { supabase } from './supabase'

const ACCOUNT_STORAGE_KEY = 'activeAccountId'
let cachedAccountId = null
let inflightSessionPromise = null

const readAccountIdFromStorage = () => {
  if (typeof window === 'undefined') return null
  return (
    window.sessionStorage?.getItem(ACCOUNT_STORAGE_KEY) ||
    window.localStorage?.getItem(ACCOUNT_STORAGE_KEY) ||
    null
  )
}

const persistAccountId = (accountId) => {
  if (typeof window === 'undefined' || !accountId) return
  try {
    window.sessionStorage?.setItem(ACCOUNT_STORAGE_KEY, accountId)
    window.localStorage?.setItem(ACCOUNT_STORAGE_KEY, accountId)
  } catch (err) {
    console.warn('Unable to persist activeAccountId in storage', err)
  }
}

const fetchAccountIdFromSession = async () => {
  if (typeof window === 'undefined') return null

  if (!inflightSessionPromise) {
    inflightSessionPromise = supabase.auth.getSession().finally(() => {
      inflightSessionPromise = null
    })
  }

  try {
    const { data } = await inflightSessionPromise
    const session = data?.session
    const user = session?.user

    return (
      user?.user_metadata?.account_id ||
      user?.app_metadata?.account_id ||
      user?.user_metadata?.account?.id ||
      null
    )
  } catch (error) {
    console.warn('Unable to read account_id from Supabase session', error)
    return null
  }
}

const fallbackAccountId = () =>
  process.env.NEXT_PUBLIC_DEFAULT_ACCOUNT_ID || process.env.DEFAULT_ACCOUNT_ID || null

export async function getCurrentAccountId({ required = true } = {}) {
  if (cachedAccountId) return cachedAccountId

  const stored = readAccountIdFromStorage()
  if (stored) {
    cachedAccountId = stored
    return stored
  }

  const sessionAccountId = await fetchAccountIdFromSession()
  if (sessionAccountId) {
    cachedAccountId = sessionAccountId
    persistAccountId(sessionAccountId)
    return sessionAccountId
  }

  const envAccountId = fallbackAccountId()
  if (envAccountId) {
    cachedAccountId = envAccountId
    return envAccountId
  }

  if (required) {
    throw new Error('No active account selected. Call setActiveAccountId(accountId) after login.')
  }

  return null
}

export function setActiveAccountId(accountId) {
  cachedAccountId = accountId || null
  persistAccountId(accountId)
}

export function clearStoredAccountId() {
  cachedAccountId = null
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage?.removeItem(ACCOUNT_STORAGE_KEY)
    window.localStorage?.removeItem(ACCOUNT_STORAGE_KEY)
  } catch (error) {
    console.warn('Unable to clear stored account id', error)
  }
}
