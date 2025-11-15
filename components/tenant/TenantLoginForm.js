'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { setActiveAccountId } from '@/lib/accountHelpers'
import { useTranslation } from '@/components/TranslationProvider'

export default function TenantLoginForm({ account }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      if (data?.session) {
        router.replace('/')
      }
    })
    return () => {
      active = false
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

    const accountId =
      data?.user?.user_metadata?.account_id ||
      data?.user?.app_metadata?.account_id ||
      data?.user?.user_metadata?.account?.id ||
      account.id

    if (accountId) {
      setActiveAccountId(accountId)
    }

    setMessage(t('portal.login.success'))
    setLoading(false)
    router.replace('/')
  }

  return (
    <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-8 shadow-xl">
      <div className="space-y-3 text-center mb-6">
        {account.logo_url && (
          <Image
            src={account.logo_url}
            alt={t('portal.landing.logoAlt', { name: account.name })}
            width={64}
            height={64}
            className="mx-auto h-16 w-16 rounded-full border-2 border-gray-100 object-cover shadow-sm"
            unoptimized
          />
        )}
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-primary">
          {t('portal.login.heading')}
        </p>
        <h2 className="text-3xl font-bold text-gray-900">
          {t('portal.login.title', { name: account.name })}
        </h2>
        <p className="text-gray-600 text-sm">
          {t('portal.login.description', { name: account.name })}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {t('portal.login.fields.email')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-gray-900"
            placeholder={t('portal.login.placeholders.email')}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {t('portal.login.fields.password')}
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-gray-900"
            placeholder={t('portal.login.placeholders.password')}
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {message && <p className="text-sm text-emerald-600">{message}</p>}

        <button
          type="submit"
          className="w-full py-3 rounded-full font-semibold text-white shadow-brand-glow"
          style={{ backgroundColor: account.brand_primary || '#4fafa9' }}
          disabled={loading}
        >
          {loading ? t('portal.login.submitting') : t('portal.login.submit')}
        </button>
      </form>
    </div>
  )
}
