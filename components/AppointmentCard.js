// ============================================
// FILE: components/AppointmentCard.js
// Single appointment card component
// ============================================

'use client'

import { formatDate, formatTime } from '@/utils/dateUtils'
import { getGoogleMapsLink, formatAddressForDisplay } from '@/utils/addressUtils'
import { useTranslation } from '@/components/TranslationProvider'

export default function AppointmentCard({ appointment, onComplete, onDelete, onEdit }) {
    const { t, resolvedLocale } = useTranslation()
    const mapLabel = t('appointmentCard.addressLink')
    const fallbackAddress = t('appointmentCard.addressMissing')
    const dateText = formatDate(appointment.appointment_date, resolvedLocale)
    const timeText = formatTime(appointment.appointment_time, resolvedLocale)

    return (
        <div
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${appointment.status === 'completed'
                ? 'border-green-500 bg-green-50'
                : 'border-indigo-500'
                }`}
        >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-gray-800">
                            {appointment.customer_name}
                        </h3>
                        {appointment.status === 'completed' && (
                            <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                                ✓ {t('appointmentCard.statusCompleted')}
                            </span>
                        )}
                    </div>

                    <div className="text-gray-700 space-y-1 text-base">
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{t('appointmentCard.labels.pet')}:</span>
                            <span className="font-medium">{appointment.pet_name}</span>
                        </div>
                        {appointment.phone && (
                            <div className="flex items-center gap-2">
                                <span className="font-bold">{t('appointmentCard.labels.phone')}:</span>
                                <a
                                    href={`tel:${appointment.phone}`}
                                    className="font-medium text-indigo-600 hover:underline"
                                >
                                    {appointment.phone}
                                </a>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{t('appointmentCard.labels.service')}:</span>
                            <span className="font-medium">{appointment.service}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{t('appointmentCard.labels.date')}:</span>
                            <span className="font-bold text-indigo-600">
                                {t('appointmentCard.dateTime', { date: dateText, time: timeText })}
                            </span>
                        </div>
                        {appointment.customers?.address && (
                            <div className="flex items-center gap-2">
                                <span className="font-bold">{t('appointmentCard.labels.address')}:</span>
                                <a
                                    href={getGoogleMapsLink(appointment.customers.address)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-indigo-600 hover:underline flex items-center gap-1"
                                >
                                    {formatAddressForDisplay(appointment.customers.address, {
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

                <div className="flex sm:flex-col gap-2">
                    <button
                        onClick={() => onEdit(appointment)}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-5 rounded-lg transition duration-200 text-sm whitespace-nowrap shadow-md"
                    >
                        ✏️ {t('appointmentCard.buttons.edit')}
                    </button>
                    {appointment.status !== 'completed' && (
                        <button
                            onClick={() => onComplete(appointment.id)}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-5 rounded-lg transition duration-200 text-sm whitespace-nowrap shadow-md"
                        >
                            ✓ {t('appointmentCard.buttons.complete')}
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(appointment.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-5 rounded-lg transition duration-200 text-sm whitespace-nowrap shadow-md"
                    >
                        🗑 {t('appointmentCard.buttons.delete')}
                    </button>
                </div>
            </div>
        </div>
    )
}
