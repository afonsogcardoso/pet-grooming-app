'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ADMIN_FLAG = 'platform_admin'

function isPlatformAdmin(user) {
  if (!user) return false
  if (user.email && user.email_verified === false) {
    // still rely on metadata below
  }
  const userMetadata = user.user_metadata || {}
  const appMetadata = user.app_metadata || {}
  if (userMetadata[ADMIN_FLAG] === true || userMetadata[ADMIN_FLAG] === 'true') {
    return true
  }
  if (appMetadata[ADMIN_FLAG] === true || appMetadata[ADMIN_FLAG] === 'true') {
    return true
  }
  const roles = Array.isArray(appMetadata.roles) ? appMetadata.roles : []
  return roles.includes(ADMIN_FLAG)
}

const errorMap = {
  no_session: 'Precisas de iniciar sessão para aceder ao portal de admin.',
  invalid_session: 'Sessão expirada. Por favor volta a autenticar-te.',
  forbidden: 'Esta conta não tem permissões de plataforma.',
  internal_error: 'Ocorreu um erro a validar a sessão. Tenta novamente.'
}

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/admin'
  const adminError = searchParams.get('adminError')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(adminError ? errorMap[adminError] : null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      const sessionUser = data?.session?.user
      if (sessionUser && isPlatformAdmin(sessionUser)) {
        router.replace('/admin')
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
      } catch (syncError) {
        console.error('Failed to sync admin session', syncError)
      }
    }

    const user = data?.user || session?.user
    if (!isPlatformAdmin(user)) {
      setError('Esta conta não tem acesso ao portal de admin.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    setMessage('Login efetuado. A redirecionar...')
    setLoading(false)
    router.replace(redirectTo || '/admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-slate-100">
      <div className="w-full max-w-lg space-y-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl backdrop-blur">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Portal Admin</p>
          <h1 className="text-3xl font-bold text-white">Área restrita</h1>
          <p className="text-sm text-slate-300">
            Autentica-te com uma conta de plataforma para gerir tenants, utilizadores e domínios.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {message}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/40 px-4 py-3 text-base text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/40 px-4 py-3 text-base text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-500 py-3 text-lg font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'A entrar…' : 'Entrar no portal admin'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Precisas de ajuda? <Link href="mailto:support@example.com" className="text-emerald-300 underline">Contacta o suporte</Link>
        </p>

        <div className="text-center text-xs text-slate-500">
          <Link href="/login" className="text-slate-300 underline">
            Voltar ao login do workspace
          </Link>
        </div>
      </div>
    </div>
  )
}
