// ============================================
// FILE: components/AppointmentCard.js
// Single appointment card component
// ============================================

'use client'

import Image from 'next/image'
import { formatDate, formatTime } from '@/utils/dateUtils'
import { getGoogleMapsLink, formatAddressForDisplay } from '@/utils/addressUtils'
import { useTranslation } from '@/components/TranslationProvider'

export default function AppointmentCard({ appointment, onComplete, onDelete, onEdit, onTogglePayment }) {
    const { t, resolvedLocale } = useTranslation()
    const mapLabel = t('appointmentCard.addressLink')
    const fallbackAddress = t('appointmentCard.addressMissing')
    const dateText = formatDate(appointment.appointment_date, resolvedLocale)
    const timeText = formatTime(appointment.appointment_time, resolvedLocale)
    const customerName = appointment.customers?.name || t('appointmentCard.unknownCustomer')
    const phoneNumber = appointment.customers?.phone || ''
    const address = appointment.customers?.address
    const petName = appointment.pets?.name || t('appointmentCard.unknownPet')
    const petBreed = appointment.pets?.breed
    const petPhoto = appointment.pets?.photo_url
    const serviceName = appointment.services?.name || t('appointmentCard.unknownService')
    const paymentStatus = appointment.payment_status || 'unpaid'
    const phoneDigits = (phoneNumber || '').replace(/\D/g, '')

    const buildConfirmationUrl = () => {
        if (typeof window === 'undefined') return ''
        if (!appointment?.id || !appointment?.public_token) return ''
        const url = new URL('/appointments/confirm', window.location.origin)
        url.searchParams.set('id', appointment.id)
        url.searchParams.set('token', appointment.public_token)
        return url.toString()
    }

    const handleShareWhatsApp = () => {
        if (typeof window === 'undefined') return
        const confirmationUrl = buildConfirmationUrl()
        const introMessage = customerName
            ? t('appointmentCard.share.messageWithName', {
                customer: customerName,
                date: dateText,
                time: timeText
            })
            : t('appointmentCard.share.messageNoName', {
                date: dateText,
                time: timeText
            })

        const detailLines = [
            serviceName && t('appointmentCard.share.service', { service: serviceName }),
            petName && t('appointmentCard.share.pet', { pet: petBreed ? `${petName} (${petBreed})` : petName }),
            address && t('appointmentCard.share.address', { address }),
            confirmationUrl && t('appointmentCard.share.link', { url: confirmationUrl })
        ].filter(Boolean)

        const messageBody = [introMessage, '', ...detailLines].join('\n')

        const waUrl = `https://wa.me/${phoneDigits || ''}?text=${encodeURIComponent(messageBody)}`
        window.open(waUrl, '_blank', 'noopener,noreferrer')
    }

    return (
        <div
            className={`bg-white rounded-lg shadow-md p-5 sm:p-6 border-l-4 ${appointment.status === 'completed'
                ? 'border-brand-accent bg-brand-accent-soft'
                : 'border-brand-primary'
                }`}
        >
            <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-start">
                    <div className="flex flex-1 items-start gap-3 sm:gap-4">
                        {petPhoto && (
                            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-brand-primary bg-brand-primary-soft flex-shrink-0 shadow-sm">
                                <Image
                                    src={petPhoto}
                                    alt={t('appointmentCard.labels.petPhotoAlt', {
                                        pet: petName
                                    })}
                                    width={80}
                                    height={80}
                                    sizes="(max-width: 640px) 80px, 96px"
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                    unoptimized
                                />
                            </div>
                        )}

                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xl font-bold text-gray-800">
                                    {customerName}
                                </h3>
                                {appointment.status === 'completed' && (
                                    <span className="bg-brand-accent text-white text-xs font-semibold px-2 py-1 rounded">
                                        ✓ {t('appointmentCard.statusCompleted')}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex items-center gap-1 rounded-full border border-brand-primary bg-white px-3 py-1 text-xs font-semibold text-brand-primary shadow-sm">
                                    📅 <span>{dateText}</span>
                                </div>
                                <div className="inline-flex items-center gap-1 rounded-full border border-brand-primary bg-white px-3 py-1 text-xs font-semibold text-brand-primary shadow-sm">
                                    ⏱ <span>{timeText}</span>
                                </div>
                                <div
                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
                                        paymentStatus === 'paid'
                                            ? 'border-green-200 bg-green-50 text-green-700'
                                            : 'border-orange-200 bg-orange-100 text-orange-800'
                                    }`}
                                >
                                    <span>{paymentStatus === 'paid' ? '💳' : '💸'}</span>
                                    <span>
                                        {paymentStatus === 'paid'
                                            ? t('appointmentCard.payment.paid')
                                            : t('appointmentCard.payment.unpaid')}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-1 space-y-1 text-sm text-gray-700 sm:text-base">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">{t('appointmentCard.labels.pet')}:</span>
                                    <span className="font-medium">
                                        {petName}
                                        {petBreed && (
                                            <span className="text-gray-500 font-normal text-sm">
                                                {' '}
                                                ({petBreed})
                                            </span>
                                        )}
                                    </span>
                                </div>
                                {phoneNumber && (
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">{t('appointmentCard.labels.phone')}:</span>
                                        <a
                                            href={`tel:${phoneNumber}`}
                                            className="font-medium text-brand-primary underline-offset-4 hover:underline"
                                        >
                                            {phoneNumber}
                                        </a>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">{t('appointmentCard.labels.service')}:</span>
                                    <span className="font-medium">{serviceName}</span>
                                </div>
                                {address && (
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">{t('appointmentCard.labels.address')}:</span>
                                        <a
                                            href={getGoogleMapsLink(address)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-brand-primary hover:underline flex items-center gap-1"
                                        >
                                            {formatAddressForDisplay(address, {
                                                mapLabel,
                                                emptyLabel: fallbackAddress
                                            })}
                                            <span className="text-xs">🗺️</span>
                                        </a>
                                    </div>
                                )}
                                {appointment.notes && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                        <span className="font-bold">{t('appointmentCard.labels.notes')}:</span>
                                        <p className="mt-1 font-medium text-gray-700">{appointment.notes}</p>
                                    </div>
                                )}
                                {(appointment.before_photo_url || appointment.after_photo_url) && (
                                    <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                                        <span className="font-bold">
                                            {t('appointmentCard.labels.beforeAfter')}
                                        </span>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {appointment.before_photo_url && (
                                                <div>
                                                    <p className="mb-1 text-xs text-gray-500">
                                                        {t('appointmentCard.labels.before')}
                                                    </p>
                                                    <Image
                                                        src={appointment.before_photo_url}
                                                        alt={t('appointmentCard.labels.before')}
                                                        width={120}
                                                        height={120}
                                                        sizes="(max-width: 640px) 45vw, 120px"
                                                        className="h-24 w-full rounded-lg border border-brand-primary object-cover"
                                                        loading="lazy"
                                                        decoding="async"
                                                        unoptimized
                                                    />
                                                </div>
                                            )}
                                            {appointment.after_photo_url && (
                                                <div>
                                                    <p className="mb-1 text-xs text-gray-500">
                                                        {t('appointmentCard.labels.after')}
                                                    </p>
                                                    <Image
                                                        src={appointment.after_photo_url}
                                                        alt={t('appointmentCard.labels.after')}
                                                        width={120}
                                                        height={120}
                                                        sizes="(max-width: 640px) 45vw, 120px"
                                                        className="h-24 w-full rounded-lg border border-brand-accent object-cover"
                                                        loading="lazy"
                                                        decoding="async"
                                                        unoptimized
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                    <button
                        onClick={handleShareWhatsApp}
                        className="inline-flex items-center justify-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 sm:w-auto"
                    >
                        🟢
                        <span className="hidden sm:inline">{t('appointmentCard.buttons.share')}</span>
                        <span className="sm:hidden">{t('appointmentCard.buttons.shareShort')}</span>
                    </button>
                    <button
                        onClick={() => onEdit(appointment)}
                        className="inline-flex items-center justify-center gap-1 rounded-full border border-brand-primary bg-white px-3 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary-soft sm:w-auto"
                    >
                        ✏️
                        <span className="hidden sm:inline">{t('appointmentCard.buttons.edit')}</span>
                    </button>
                    {onTogglePayment && paymentStatus !== 'paid' && (
                        <button
                            onClick={() => onTogglePayment(appointment)}
                            className="inline-flex items-center justify-center gap-1 rounded-full px-3 py-2 text-sm font-semibold transition sm:w-auto border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                            <span>💳</span>
                            <span className="hidden sm:inline">
                                {t('appointmentCard.buttons.markPaid')}
                            </span>
                            <span className="sm:hidden">
                                {t('appointmentCard.buttons.markPaidShort')}
                            </span>
                        </button>
                    )}
                    {appointment.status !== 'completed' && (
                        <button
                            onClick={() => onComplete(appointment.id)}
                            className="inline-flex items-center justify-center gap-1 rounded-full bg-brand-accent px-3 py-2 text-sm font-semibold text-brand-secondary transition hover:bg-brand-accent-dark hover:text-white sm:w-auto"
                        >
                            ✓
                            <span className="hidden sm:inline">{t('appointmentCard.buttons.complete')}</span>
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(appointment.id)}
                        className="inline-flex items-center justify-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 sm:w-auto"
                    >
                        🗑
                        <span className="hidden sm:inline">{t('appointmentCard.buttons.delete')}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
