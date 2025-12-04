'use client'

import { useEffect, useRef, useState } from 'react'
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
  const { authenticated, account, membership, memberships, selectAccount, user } = useAccount()
  const [logoError, setLogoError] = useState(false)
  const defaultLogo = '/brand-logo.png'
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    setMenuOpen(false)
    setProfileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    function handleClickAway(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickAway)
    return () => {
      document.removeEventListener('mousedown', handleClickAway)
    }
  }, [])

  const isTenantPublicRoute = pathname?.startsWith('/portal/')
  const publicRoutes = ['/login', '/appointments/confirm']
  const isPublicRoute = isTenantPublicRoute || publicRoutes.some((route) => pathname?.startsWith(route))
  const isLoginRoute = pathname?.startsWith('/login')
  const isAdminRoute = pathname?.startsWith('/admin')
  const availableNavItems = navItems.filter((item) => {
    if (item.href !== '/settings') return true
    return ['owner', 'admin', 'platform_admin'].includes(membership?.role)
  })

  if (isAdminRoute) {
    // Admin shell has its own layout and guards
    return <>{children}</>
  }

  if (isTenantPublicRoute) {
    return <div className="min-h-screen brand-background">{children}</div>
  }

  if (isLoginRoute) {
    return <div className="min-h-screen brand-background">{children}</div>
  }

  return (
    <div className="min-h-screen brand-background">
      <header className="sticky top-0 z-40 hidden border-b border-slate-200 bg-white/90 backdrop-blur-md md:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
          <Link
            href="/appointments"
            className="flex w-full max-w-xs items-center gap-3 sm:max-w-none sm:justify-start"
            aria-label={t('app.title')}
          >
            {!logoError ? (
              <Image
                src={account?.logo_url || defaultLogo}
                alt={t('app.logoAlt', { name: account?.name || t('app.title') })}
                width={56}
                height={56}
                priority
                className="rounded-2xl border border-slate-200 shadow-brand-glow"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary text-2xl font-bold text-white shadow-brand-glow">
                🐾
              </div>
            )}
            <div className="min-w-0 text-left leading-tight">
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 sm:text-xs">
                {t('app.title')}
              </p>
              <p className="text-base font-semibold text-slate-900 sm:text-lg">
                {account?.name || t('account.select.untitled')}
              </p>
            </div>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {authenticated &&
              availableNavItems.map(({ href, labelKey, icon }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'border-brand-primary bg-brand-primary text-white shadow-brand-glow'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-brand-primary/60 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-base">{icon}</span>
                    <span>{t(labelKey)}</span>
                  </Link>
                )
              })}
          </nav>
          <div className="flex items-center gap-3">
            {authenticated && user && (
              <div className="relative hidden md:block" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-600 shadow-sm hover:border-brand-primary"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                >
                  <span className="sr-only">{t('app.profile.viewProfile')}</span>
                  <span>{user.email?.charAt(0)?.toUpperCase() || '👤'}</span>
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-48 rounded-2xl border border-slate-200 bg-white py-2 text-sm text-slate-700 shadow-xl">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      👤 {t('app.profile.viewProfile')}
                    </Link>
                    <button
                      type="button"
                    onClick={async () => {
                      setProfileMenuOpen(false)
                      try {
                        await Promise.all([supabase.auth.signOut(), fetch('/api/auth/signout', { method: 'POST' })])
                      } catch (error) {
                          console.error('Failed to sign out completely', error)
                        } finally {
                          clearStoredAccountId()
                          router.push('/login')
                        }
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50"
                    >
                      ⎋ {t('account.actions.logout')}
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-600 shadow-sm hover:text-slate-900 md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? t('app.nav.close') : t('app.nav.menu')}
            >
              ☰
            </button>
          </div>
        </div>
        <div
          id="mobile-nav"
          className={`${menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'} md:hidden overflow-hidden border-t border-slate-200 bg-white/95 px-4 pb-4 transition-all`}
        >
          {authenticated && (
            <div className="flex flex-col gap-3 pt-4">
              {availableNavItems.map(({ href, labelKey, icon }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-base font-semibold ${
                      isActive
                        ? 'border-brand-primary bg-brand-primary text-white shadow-brand-glow'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-brand-primary/60 hover:text-slate-900'
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>{icon}</span>
                    <span>{t(labelKey)}</span>
                  </Link>
                )
              })}
              {authenticated && user && (
                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-base">
                    {user.email?.charAt(0)?.toUpperCase() || '👤'}
                  </span>
                  <span>{user.email}</span>
                </Link>
              )}
              {authenticated && (
                <button
                  type="button"
                  onClick={async () => {
                    setMenuOpen(false)
                    try {
                      await Promise.all([supabase.auth.signOut(), fetch('/api/auth/signout', { method: 'POST' })])
                    } catch (error) {
                      console.error('Failed to sign out completely', error)
                    } finally {
                      clearStoredAccountId()
                      router.push('/login')
                    }
                  }}
                  className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600"
                >
                  {t('account.actions.logout')}
                </button>
              )}
            </div>
          )}
        </div>
        {authenticated && memberships?.length > 1 && (
          <div className="border-t border-slate-100 bg-white/80 px-4 py-2 text-sm text-slate-600">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
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
          </div>
        )}
      </header>
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-white/70 backdrop-blur-xl transition md:hidden"
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 sm:py-8 sm:pb-10">
        {isPublicRoute ? children : <AccountGate>{children}</AccountGate>}
      </main>

      {authenticated && !isPublicRoute && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-6px_18px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-around gap-1">
            {availableNavItems.map(({ href, labelKey, icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-brand-primary text-white shadow-brand-glow'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-lg leading-none">{icon}</span>
                  <span className="line-clamp-1">{t(labelKey)}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
