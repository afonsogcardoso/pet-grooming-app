'use client'

// ============================================
// FILE: components/AccountProvider.js
// Provides the active account context for the app
// ============================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  clearStoredAccountId,
  getCurrentAccountId,
  setActiveAccountId
} from '@/lib/accountHelpers'

const AccountContext = createContext(null)

const DEFAULT_BRANDING = {
  brand_primary: '#4fafa9',
  brand_primary_soft: '#e7f8f7',
  brand_accent: '#f4d58d',
  brand_accent_soft: '#fdf6de',
  brand_background: '#fdfcf9',
  brand_gradient: 'linear-gradient(140deg, rgba(79,175,169,0.95), rgba(118,98,78,0.85))',
  logo_url: null
}

const emptyState = {
  account: null,
  membership: null,
  memberships: [],
  loading: true,
  error: null,
  authenticated: false
}

export function AccountProvider({ children }) {
  const [state, setState] = useState(emptyState)
  const [currentUserId, setCurrentUserId] = useState(null)

  const deriveActiveMembership = useCallback(async (memberships) => {
    let preferredAccountId = null
    try {
      preferredAccountId = await getCurrentAccountId({ required: false })
    } catch {
      preferredAccountId = null
    }

    let membership = null
    if (preferredAccountId) {
      membership = memberships.find((entry) => entry.account_id === preferredAccountId) || null
    }

    if (!membership) {
      membership = memberships[0] || null
      if (membership) {
        setActiveAccountId(membership.account_id)
      } else {
        clearStoredAccountId()
      }
    }

    setState({
      account: membership?.account || null,
      membership,
      memberships,
      loading: false,
      error: null,
      authenticated: true
    })
  }, [])

  const fetchMemberships = useCallback(
    async (userId) => {
      if (!userId) {
        setState({
          account: null,
          membership: null,
          memberships: [],
          loading: false,
          error: null
        })
        return
      }

      setState((prev) => ({ ...prev, loading: true, error: null, authenticated: true }))

      const { data, error } = await supabase
        .from('account_members')
        .select(
          `
          id,
          account_id,
          role,
          status,
          created_at,
          account:accounts (
            id,
            name,
            slug,
            plan,
            created_at,
            updated_at,
            logo_url,
            brand_primary,
            brand_primary_soft,
            brand_accent,
            brand_accent_soft,
            brand_background,
            brand_gradient
          )
        `
        )
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: true })

      if (error) {
        setState((prev) => ({ ...prev, loading: false, error, authenticated: true }))
        return
      }

      await deriveActiveMembership(data || [])
    },
    [deriveActiveMembership]
  )

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      const session = data?.session
      const userId = session?.user?.id || null
      setCurrentUserId(userId)

      if (!session) {
        clearStoredAccountId()
        setState({
          account: null,
          membership: null,
          memberships: [],
          loading: false,
          error: null,
          authenticated: false
        })
        return
      }

      fetchMemberships(userId)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id || null
      setCurrentUserId(userId)

      if (!session) {
        clearStoredAccountId()
        setState({
          account: null,
          membership: null,
          memberships: [],
          loading: false,
          error: null,
          authenticated: false
        })
        return
      }

      fetchMemberships(userId)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchMemberships])

  const selectAccount = useCallback((accountId) => {
    if (!accountId) return
    setState((prev) => {
      const membership = prev.memberships.find((m) => m.account_id === accountId) || null
      if (!membership) return prev
      setActiveAccountId(accountId)
      return {
        ...prev,
        account: membership.account,
        membership
      }
    })
  }, [])

  const refresh = useCallback(() => {
    if (!currentUserId) return
    fetchMemberships(currentUserId)
  }, [currentUserId, fetchMemberships])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const branding = state.account ?? DEFAULT_BRANDING
    root.style.setProperty('--brand-primary', branding.brand_primary || DEFAULT_BRANDING.brand_primary)
    root.style.setProperty(
      '--brand-primary-soft',
      branding.brand_primary_soft || DEFAULT_BRANDING.brand_primary_soft
    )
    root.style.setProperty('--brand-accent', branding.brand_accent || DEFAULT_BRANDING.brand_accent)
    root.style.setProperty(
      '--brand-accent-dark',
      branding.brand_accent ? branding.brand_accent : DEFAULT_BRANDING.brand_accent
    )
    root.style.setProperty(
      '--brand-accent-soft',
      branding.brand_accent_soft || DEFAULT_BRANDING.brand_accent_soft
    )
    root.style.setProperty(
      '--brand-secondary',
      branding.brand_primary || DEFAULT_BRANDING.brand_primary
    )
    root.style.setProperty(
      '--brand-secondary-soft',
      branding.brand_accent_soft || DEFAULT_BRANDING.brand_accent_soft
    )
    root.style.setProperty('--brand-surface', branding.brand_background || DEFAULT_BRANDING.brand_background)
    root.style.setProperty(
      '--brand-gradient',
      branding.brand_gradient || DEFAULT_BRANDING.brand_gradient
    )
    root.style.setProperty('--background', branding.brand_background || DEFAULT_BRANDING.brand_background)
  }, [state.account])

  const value = useMemo(
    () => ({
      ...state,
      selectAccount,
      refresh
    }),
    [state, selectAccount, refresh]
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount() {
  const context = useContext(AccountContext)
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider')
  }
  return context
}
