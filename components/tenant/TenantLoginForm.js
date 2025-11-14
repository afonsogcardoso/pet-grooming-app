'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { setActiveAccountId } from '@/lib/accountHelpers'

export default function TenantLoginForm({ account }) {
  const router = useRouter()
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

    setMessage('Login efetuado com sucesso.')
    setLoading(false)
    router.replace('/')
  }

  return (
    <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-8 shadow-xl">
      <div className="space-y-3 text-center mb-6">
        <p className="text-sm uppercase tracking-widest text-gray-500">Portal {account.slug}</p>
        <h2 className="text-2xl font-bold text-gray-900">Entrar em {account.name}</h2>
        <p className="text-gray-600 text-sm">
          Usa as credenciais da tua equipa para aceder ao backoffice.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-gray-900"
            placeholder="teu-nome@empresa.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-gray-900"
            placeholder="••••••••"
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
          {loading ? 'A entrar…' : 'Entrar no portal'}
        </button>
      </form>
    </div>
  )
}
