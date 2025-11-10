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
            updated_at
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
