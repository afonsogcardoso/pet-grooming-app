'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo } from 'react'
import { useTranslation } from '@/components/TranslationProvider'

function gradientStyle(account) {
  if (account?.brand_gradient) {
    return { backgroundImage: account.brand_gradient }
  }
  if (account?.brand_primary && account?.brand_accent) {
    return {
      backgroundImage: `linear-gradient(135deg, ${account.brand_primary}, ${account.brand_accent})`
    }
  }
  return {
    backgroundImage: 'linear-gradient(135deg, #4fafa9, #7a5af8)'
  }
}

export default function PortalLanding({ account }) {
  const { t } = useTranslation()
  const primary = account.brand_primary || '#4fafa9'
  const accent = account.brand_accent || '#f4d58d'
  const background = account.brand_background || '#fdfcf9'

  const featureKeys = useMemo(
    () => ['portal.landing.cards.team', 'portal.landing.cards.schedule', 'portal.landing.cards.updates'],
    []
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: background }}>
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10" style={gradientStyle(account)} />
        <div className="max-w-5xl mx-auto px-6 py-16 text-white">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              {account.logo_url && (
                <Image
                  src={account.logo_url}
                  alt={t('portal.landing.logoAlt', { name: account.name })}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full border-2 border-white/60 object-cover bg-white/20"
                  unoptimized
                />
              )}
              <div>
                <p className="text-sm uppercase tracking-widest text-white/80">
                  {t('portal.landing.badge')}
                </p>
                <h1 className="text-4xl md:text-5xl font-bold">{account.name}</h1>
              </div>
            </div>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl">
              {t('portal.landing.description', { name: account.name })}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/portal/${account.slug}/login`}
                className="btn-brand px-8 py-3 text-lg font-semibold"
                style={{
                  backgroundColor: primary,
                  borderColor: primary,
                  color: '#fff',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.15)'
                }}
              >
                {t('portal.landing.cta')}
              </Link>
              <a
                href={`mailto:${account.support_email || 'contact@pet-grooming.app'}`}
                className="px-8 py-3 rounded-full border-2 font-semibold text-white hover:bg-white/10"
              >
                {t('portal.landing.contactTeam')}
              </a>
            </div>
          </div>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          {featureKeys.map((key) => (
            <div key={key} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2" style={{ color: primary }}>
                {t(`${key}.title`)}
              </h3>
              <p className="text-gray-600">{t(`${key}.text`)}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ backgroundColor: account.brand_primary_soft || '#e7f8f7', color: primary }}
          >
            {t('portal.landing.securityBadge', { name: account.name })}
          </span>
        </div>
      </section>
    </div>
  )
}
