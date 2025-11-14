'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import LanguageSwitcher from './LanguageSwitcher'
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
  const { authenticated, account, membership } = useAccount()
  const [logoError, setLogoError] = useState(false)
  const defaultLogo = '/brand-logo.png'
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const isTenantPublicRoute = pathname?.startsWith('/booking/')
  const publicRoutes = ['/login']
  const isPublicRoute = isTenantPublicRoute || publicRoutes.some((route) => pathname?.startsWith(route))

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
                  alt="Pet Grooming logo"
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
            >
              ☰
            </button>
          </div>

          <div className="nav-wrap">
            <nav
              id="primary-nav"
              className={`${menuOpen ? 'flex' : 'hidden'} flex-col sm:flex sm:flex-row sm:flex-nowrap sm:items-center sm:overflow-x-auto sm:no-scrollbar gap-3 sm:gap-4`}
            >
              {navItems
                .filter((item) => {
                  if (item.href !== '/settings') return true
                  return ['owner', 'admin'].includes(membership?.role)
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
              <LanguageSwitcher />
              {authenticated && (
                <button
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut()
                    clearStoredAccountId()
                    router.push('/login')
                  }}
                  className="nav-link bg-white/80 text-red-600 border border-red-200 hover:bg-red-50 font-semibold px-4 py-2 rounded-full text-sm"
                >
                  {t('account.actions.logout')}
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isPublicRoute ? children : <AccountGate>{children}</AccountGate>}
      </main>
    </div>
  )
}
