// ============================================
// FILE: components/AppointmentCard.js
// Single appointment card component
// ============================================

'use client'

import Image from 'next/image'
import { formatDate, formatTime } from '@/utils/dateUtils'
import { getGoogleMapsLink, formatAddressForDisplay } from '@/utils/addressUtils'
import { useTranslation } from '@/components/TranslationProvider'

export default function AppointmentCard({ appointment, onComplete, onDelete, onEdit }) {
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

    return (
        <div
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${appointment.status === 'completed'
                ? 'border-brand-accent bg-brand-accent-soft'
                : 'border-brand-primary'
                }`}
        >
            <div className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
                    <div className="flex items-start gap-4">
                        {petPhoto && (
                            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-brand-primary bg-brand-primary-soft flex-shrink-0 shadow-sm">
                                <Image
                                    src={petPhoto}
                                    alt={t('appointmentCard.labels.petPhotoAlt', {
                                        pet: petName
                                    })}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                />
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-xl font-bold text-gray-800">
                                    {customerName}
                                </h3>
                                {appointment.status === 'completed' && (
                                    <span className="bg-brand-accent text-white text-xs font-semibold px-2 py-1 rounded">
                                        ✓ {t('appointmentCard.statusCompleted')}
                                    </span>
                                )}
                            </div>

                            <div className="text-gray-700 space-y-1 text-base mt-2">
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
                                            className="font-medium text-brand-primary hover:underline"
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
                                        <p className="text-gray-700 mt-1 font-medium">{appointment.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-brand-primary text-brand-primary font-semibold bg-white shadow-sm">
                            📅 <span>{dateText}</span>
                        </div>
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-brand-primary text-brand-primary font-semibold bg-white shadow-sm">
                            ⏱ <span>{timeText}</span>
                        </div>
                    </div>
                </div>

                <div className="flex sm:flex-col gap-2">
                    <button
                        onClick={() => onEdit(appointment)}
                        className="btn-brand-outlined py-3 px-3 text-sm whitespace-nowrap shadow-md text-center"
                    >
                        ✏️
                        <span className="hidden sm:inline ml-1">{t('appointmentCard.buttons.edit')}</span>
                    </button>
                    {appointment.status !== 'completed' && (
                        <button
                            onClick={() => onComplete(appointment.id)}
                            className="bg-brand-accent hover:bg-brand-accent-dark text-white font-bold py-3 px-3 rounded-lg transition duration-200 text-sm whitespace-nowrap shadow-md"
                        >
                            ✓
                            <span className="hidden sm:inline ml-1">{t('appointmentCard.buttons.complete')}</span>
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(appointment.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-3 rounded-lg transition duration-200 text-sm whitespace-nowrap shadow-md"
                    >
                        🗑
                        <span className="hidden sm:inline ml-1">{t('appointmentCard.buttons.delete')}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
