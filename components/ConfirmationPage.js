'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '@/components/TranslationProvider'
import { formatDate, formatTime } from '@/utils/dateUtils'

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

export default function ConfirmationPage({ appointment }) {
  const { t, resolvedLocale } = useTranslation()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!appointment) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-brand-primary-soft via-white to-brand-accent-soft px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white/80 p-6 text-center shadow-xl backdrop-blur">
          <h1 className="text-2xl font-bold text-slate-800">{t('confirmationPage.titleNoName')}</h1>
          <p className="mt-2 text-slate-600">{t('confirmationPage.notFound')}</p>
        </div>
      </main>
    )
  }

  const customer = appointment.customers?.name || ''
  const pet = appointment.pets?.name || ''
  const service = appointment.services?.name || ''
  const address = appointment.customers?.address || ''
  const notes = appointment.notes || ''
  const paymentStatus = appointment.payment_status || 'unpaid'
  const duration = appointment.duration
  const date = appointment.appointment_date
  const time = appointment.appointment_time

  const formattedDate = useMemo(() => formatDate(date, resolvedLocale), [date, resolvedLocale])
  const formattedTime = useMemo(() => formatTime(time, resolvedLocale), [time, resolvedLocale])

  const pageTitle = customer
    ? t('confirmationPage.title', { customer })
    : t('confirmationPage.titleNoName')

  const paymentLabel =
    paymentStatus === 'paid'
      ? t('confirmationPage.payment.paid')
      : t('confirmationPage.payment.unpaid')

  const dateValue = (isMounted ? formattedDate : date) || t('confirmationPage.missing.generic')
  const timeValue = (isMounted ? formattedTime : time) || t('confirmationPage.missing.generic')
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
          <div className="mt-3 inline-block text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              {t('confirmationPage.footer.cancellation.title')}
            </p>
            <ul className="mt-1 space-y-1 text-[11px] leading-snug text-slate-600">
              <li>{t('confirmationPage.footer.cancellation.line1')}</li>
              <li>{t('confirmationPage.footer.cancellation.line2')}</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
