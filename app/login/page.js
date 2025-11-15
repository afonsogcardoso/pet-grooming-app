'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { setActiveAccountId } from '@/lib/accountHelpers'
import { useTranslation } from '@/components/TranslationProvider'

export default function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      if (data?.session) {
        router.replace('/')
      }
    })
    return () => {
      isMounted = false
    }
  }, [router])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const session = data?.session
    if (session) {
      try {
        await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token
          })
        })
      } catch (setSessionError) {
        console.error('Failed to sync Supabase session', setSessionError)
      }
    }

    const accountId =
      data?.user?.user_metadata?.account_id ||
      data?.user?.app_metadata?.account_id ||
      data?.user?.user_metadata?.account?.id ||
      null

    if (accountId) {
      setActiveAccountId(accountId)
    }

    setMessage(t('login.success'))
    setLoading(false)
    router.replace('/')
  }

  return (
    <div className="max-w-lg mx-auto bg-white border border-gray-100 rounded-2xl p-8 space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-4xl">🔐</p>
        <h1 className="text-2xl font-bold text-gray-900">{t('login.title')}</h1>
        <p className="text-gray-600">{t('login.description')}</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
            {t('login.fields.email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-lg text-gray-900 placeholder-gray-500 bg-white"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
            {t('login.fields.password')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-lg text-gray-900 placeholder-gray-500 bg-white"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {message && <p className="text-sm text-emerald-600">{message}</p>}

        <button type="submit" className="btn-brand w-full py-3 text-lg" disabled={loading}>
          {loading ? t('login.actions.loading') : t('login.actions.submit')}
        </button>
      </form>

      <div className="text-center text-sm text-gray-500">
        <span>{t('login.help.noAccount')}</span>{' '}
        <Link href="mailto:support@example.com" className="text-brand-primary font-semibold">
          {t('login.help.contact')}
        </Link>
      </div>
    </div>
  )
}
