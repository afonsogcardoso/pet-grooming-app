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
    activeClasses: 'bg-indigo-600 text-white',
    inactiveClasses: 'bg-gray-100 text-indigo-700 hover:bg-gray-200'
  },
  {
    href: '/customers',
    labelKey: 'app.nav.customers',
    activeClasses: 'bg-green-600 text-white',
    inactiveClasses: 'bg-gray-100 text-green-700 hover:bg-gray-200'
  },
  {
    href: '/services',
    labelKey: 'app.nav.services',
    activeClasses: 'bg-amber-500 text-white',
    inactiveClasses: 'bg-gray-100 text-amber-700 hover:bg-gray-200'
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
                {navItems.map(({ href, labelKey, activeClasses, inactiveClasses }) => {
                  const isActive = pathname === href
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`font-bold py-2 px-4 rounded-lg transition duration-200 ${isActive ? activeClasses : inactiveClasses}`}
                    >
                      {t(labelKey)}
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
