'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LanguageSwitcher from './LanguageSwitcher'
import { useTranslation } from './TranslationProvider'

const navItems = [
  {
    href: '/',
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
  }
]

export default function AppShell({ children }) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const [logoError, setLogoError] = useState(false)
  const logoPath = '/brand-logo.png'

  return (
    <div className="min-h-screen brand-background">
      <header className="bg-white/95 shadow-sm border-b border-gray-200 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between py-4">
            <div className="flex items-center gap-3">
              {!logoError ? (
                <Image
                  src={logoPath}
                  alt="Pet Grooming logo"
                  width={56}
                  height={56}
                  priority
                  className="rounded-full shadow-brand-glow"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-brand-glow">
                  🐾
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-indigo-600">{t('app.title')}</h1>
                <p className="text-sm text-gray-500">{t('app.description')}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <nav className="flex flex-wrap gap-2">
                {navItems.map(({ href, labelKey, icon }) => {
                  const isActive = pathname === href
                  const baseClasses =
                    'flex items-center gap-1.5 rounded-full font-semibold transition duration-200 border text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2 whitespace-nowrap'
                  const activeClasses = 'bg-brand-primary text-white border-brand-primary shadow-brand-glow'
                  const inactiveClasses =
                    'bg-white/80 text-brand-primary border-brand-primary hover:bg-brand-primary-soft'
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                    >
                      <span className="text-lg leading-none">{icon}</span>
                      <span>{t(labelKey)}</span>
                    </Link>
                  )
                })}
              </nav>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
