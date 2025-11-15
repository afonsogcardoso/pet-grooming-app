'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import AccountGate from './AccountGate'
import { useTranslation } from './TranslationProvider'
import { supabase } from '@/lib/supabase'
import { clearStoredAccountId } from '@/lib/accountHelpers'
import { useAccount } from './AccountProvider'

const navItems = [
  {
    href: '/appointments',
    labelKey: 'app.nav.appointments',
    icon: '📅'
  },
  {
    href: '/customers',
    labelKey: 'app.nav.customers',
    icon: '👥'
  },
  {
    href: '/services',
    labelKey: 'app.nav.services',
    icon: '🧴'
  },
  {
    href: '/settings',
    labelKey: 'app.nav.settings',
    icon: '⚙️'
  }
]

export default function AppShell({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const { authenticated, account, membership, memberships, selectAccount } = useAccount()
  const [logoError, setLogoError] = useState(false)
  const defaultLogo = '/brand-logo.png'
  const [menuOpen, setMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    let subscription
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data?.user || null))
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setCurrentUser(data.session.user)
      }
    })
    const authListener = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null)
    })
    subscription = authListener?.data?.subscription
    return () => {
      subscription?.unsubscribe?.()
    }
  }, [])

  const isTenantPublicRoute = pathname?.startsWith('/portal/')
  const publicRoutes = ['/login']
  const isPublicRoute = isTenantPublicRoute || publicRoutes.some((route) => pathname?.startsWith(route))
  const isAdminRoute = pathname?.startsWith('/admin')

  if (isAdminRoute) {
    // Admin shell has its own layout and guards
    return <>{children}</>
  }

  if (isTenantPublicRoute) {
    return <div className="min-h-screen brand-background">{children}</div>
  }

  return (
    <div className="min-h-screen brand-background">
      <header className="bg-white/95 shadow-sm border-b border-gray-200 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="toolbar">
            <Link href="/appointments" className="brand" aria-label={t('app.title')}>
              {!logoError ? (
                <Image
                  src={account?.logo_url || defaultLogo}
                  alt={t('app.logoAlt', { name: account?.name || t('app.title') })}
                  width={56}
                  height={56}
                  priority
                  className="rounded-full shadow-brand-glow"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-brand-primary text-white flex items-center justify-center text-2xl font-bold shadow-brand-glow">
                  🐾
                </div>
              )}
              <div className="min-w-0 text-left">
                <h1 className="brand-title">{account?.name || t('app.title')}</h1>
                <p className="brand-desc">{account?.plan ? t('account.select.plan', { plan: account.plan }) : t('app.description')}</p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(prev => !prev)}
              className="menu-btn"
              aria-expanded={menuOpen}
              aria-controls="primary-nav"
              aria-label={menuOpen ? t('app.nav.close') : t('app.nav.menu')}
            >
              ☰
            </button>
          </div>

          <div className="nav-wrap">
            <nav
              id="primary-nav"
              className={`${menuOpen ? 'flex' : 'hidden'} flex-col sm:flex sm:flex-row sm:flex-nowrap sm:items-center sm:overflow-x-auto sm:no-scrollbar gap-3 sm:gap-4`}
            >
              {authenticated &&
                navItems
                  .filter((item) => {
                    if (item.href !== '/settings') return true
                    return ['owner', 'admin', 'platform_admin'].includes(membership?.role)
                  })
                  .map(({ href, labelKey, icon }) => {
                const isActive = pathname === href
                const base =
                  'nav-link flex items-center gap-1.5 rounded-full font-semibold transition duration-200 border text-sm sm:text-base px-4 py-2.5 sm:px-5 sm:py-2.5 whitespace-nowrap'
                const active =
                  'bg-brand-primary text-white border-brand-primary shadow-brand-glow'
                const inactive =
                  'bg-white/80 text-brand-primary border-brand-primary hover:bg-brand-primary-soft'
                return (
                  <Link key={href} href={href} className={`${base} ${isActive ? active : inactive}`}>
                    <span className="nav-link-icon text-lg leading-none">{icon}</span>
                    <span className="nav-link-label">{t(labelKey)}</span>
                  </Link>
                )
              })}
              {authenticated && (
                currentUser && (
                  <Link
                    href="/profile"
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-200 bg-white/80 font-semibold text-slate-700 shadow-sm hover:border-slate-300"
                  >
                    <span className="sr-only">{t('app.profile.viewProfile')}</span>
                    <span>{currentUser.email?.charAt(0)?.toUpperCase() || '👤'}</span>
                  </Link>
                )
              )}

              {authenticated && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await Promise.all([
                        supabase.auth.signOut(),
                        fetch('/api/auth/signout', { method: 'POST' })
                      ])
                    } catch (error) {
                      console.error('Failed to sign out completely', error)
                    } finally {
                      clearStoredAccountId()
                      router.push('/login')
                    }
                  }}
                  className="nav-link bg-white/80 text-red-600 border border-red-200 hover:bg-red-50 font-semibold px-4 py-2 rounded-full text-sm"
                >
                  {t('account.actions.logout')}
                </button>
              )}
            </nav>
          </div>
          {authenticated && memberships?.length > 1 && (
            <div className="mt-3 flex flex-col gap-1 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-end">
              <label className="font-semibold text-xs uppercase tracking-wide text-slate-500">
                {t('app.tenantSwitch.label')}
              </label>
              <select
                value={membership?.account_id || memberships[0]?.account_id}
                onChange={(event) => selectAccount(event.target.value)}
                className="rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-700 focus:border-slate-500 focus:outline-none"
              >
                {memberships.map((entry) => (
                  <option key={entry.account_id} value={entry.account_id}>
                    {entry.account?.name || entry.account_id}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isPublicRoute ? children : <AccountGate>{children}</AccountGate>}
      </main>
    </div>
  )
}
