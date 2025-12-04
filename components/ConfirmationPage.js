'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from '@/components/TranslationProvider'
import { formatDate, formatTime } from '@/utils/dateUtils'

const getParam = (params, keys, fallback = '') => {
  if (!params) return fallback
  const keyList = Array.isArray(keys) ? keys : [keys]
  for (const key of keyList) {
    const value = params.get(key)
    if (value) return value
  }
  return fallback
}

const InfoRow = ({ label, value, accent }) => {
  if (!value) return null
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>
      <p className={`text-base font-semibold text-slate-900 ${accent ? 'text-brand-primary' : ''}`}>
        {value}
      </p>
    </div>
  )
}

export default function ConfirmationPage() {
  const { t, resolvedLocale } = useTranslation()
  const params = useSearchParams()

  const customer = getParam(params, ['customer', 'c'])
  const pet = getParam(params, ['pet', 'p'])
  const service = getParam(params, ['service', 's'])
  const address = getParam(params, ['address', 'a'])
  const notes = getParam(params, ['notes', 'n'])
  const paymentStatus = getParam(params, ['payment', 'pm'], 'unpaid')
  const duration = getParam(params, ['duration', 'u'])
  const date = getParam(params, ['date', 'd'])
  const time = getParam(params, ['time', 't'])

  const formattedDate = useMemo(() => formatDate(date, resolvedLocale), [date, resolvedLocale])
  const formattedTime = useMemo(() => formatTime(time, resolvedLocale), [time, resolvedLocale])

  const pageTitle = customer
    ? t('confirmationPage.title', { customer })
    : t('confirmationPage.titleNoName')

  const paymentLabel =
    paymentStatus === 'paid'
      ? t('confirmationPage.payment.paid')
      : t('confirmationPage.payment.unpaid')

  const dateValue = formattedDate || t('confirmationPage.missing.generic')
  const timeValue = formattedTime || t('confirmationPage.missing.generic')
  const serviceValue = service || t('confirmationPage.missing.generic')
  const petValue = pet || t('confirmationPage.missing.generic')
  const durationValue = duration
    ? t('confirmationPage.durationMinutes', { duration })
    : t('confirmationPage.missing.generic')
  const addressValue = address || t('confirmationPage.missing.generic')

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-primary-soft via-white to-brand-accent-soft px-4 py-10 text-slate-900">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-primary">
            {t('confirmationPage.header')}
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">{pageTitle}</h1>
          <p className="mt-2 text-base text-slate-600">{t('confirmationPage.subtitle')}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow
              label={t('confirmationPage.labels.date')}
              value={dateValue}
              accent
            />
            <InfoRow
              label={t('confirmationPage.labels.time')}
              value={timeValue}
              accent
            />
            <InfoRow
              label={t('confirmationPage.labels.service')}
              value={serviceValue}
            />
            <InfoRow
              label={t('confirmationPage.labels.pet')}
              value={petValue}
            />
            <InfoRow
              label={t('confirmationPage.labels.duration')}
              value={durationValue}
            />
            <InfoRow
              label={t('confirmationPage.labels.payment')}
              value={paymentLabel}
            />
            <InfoRow
              label={t('confirmationPage.labels.address')}
              value={addressValue}
            />
          </div>

          {notes && (
            <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-inner">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em]">
                {t('confirmationPage.labels.notes')}
              </p>
              <p className="font-medium leading-relaxed">{notes}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            <p>✅ {t('confirmationPage.footer.confirmed')}</p>
            <p>🔄 {t('confirmationPage.footer.update')}</p>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          <p>{t('confirmationPage.footer.note')}</p>
        </div>
      </div>
    </main>
  )
}
