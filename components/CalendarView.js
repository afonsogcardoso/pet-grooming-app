// ============================================
// FILE: components/CalendarView.js
// Calendar week view with time slots - click to create appointments
// ============================================

'use client'

import { useEffect, useMemo, useState } from 'react'
import { getWeekDates, getWeekRangeText, formatTime } from '@/utils/dateUtils'
import { getGoogleMapsLink } from '@/utils/addressUtils'
import { useTranslation } from '@/components/TranslationProvider'

export default function CalendarView({ appointments, weekOffset, onWeekChange, onComplete, onEdit, onCreateAtSlot }) {
    const { t, resolvedLocale } = useTranslation()
    const weekDates = getWeekDates(weekOffset)
    const [compactView, setCompactView] = useState(false)

    useEffect(() => {
        const handleResize = () => {
            if (typeof window !== 'undefined') {
                setCompactView(window.innerWidth < 768)
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const datesToRender = useMemo(() => {
        if (!compactView) return weekDates
        const today = new Date()
        const todayStr = today.toDateString()
        const idx = weekDates.findIndex((date) => date.toDateString() === todayStr)
        if (idx === -1) {
            return weekDates.slice(0, 3)
        }
        const start = Math.min(Math.max(idx, 0), Math.max(0, weekDates.length - 3))
        return weekDates.slice(start, start + 3)
    }, [compactView, weekDates])

    // Time slots from 8 AM to 6 PM in 30-minute intervals
    const timeSlots = [
        '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
        '17:00', '17:30', '18:00'
    ]

    const handlePrevious = () => {
        onWeekChange(weekOffset - 1)
    }

    const handleNext = () => {
        onWeekChange(weekOffset + 1)
    }

    const handleToday = () => {
        onWeekChange(0)
    }

    const handleAppointmentClick = (apt) => {
        // Open edit modal for any appointment
        onEdit(apt)
    }

    const handleSlotClick = (date, time) => {
        const dateStr = date.toISOString().split('T')[0]
        const existingApt = appointments.find(
            apt => apt.appointment_date === dateStr && apt.appointment_time === time
        )

        if (existingApt) {
            handleAppointmentClick(existingApt)
        } else {
            if (onCreateAtSlot) {
                onCreateAtSlot(dateStr, time)
            }
        }
    }

    const getAppointmentAtSlot = (date, time) => {
        const dateStr = date.toISOString().split('T')[0]
        // Find appointment that starts at this time
        const apt = appointments.find(
            apt => apt.appointment_date === dateStr && apt.appointment_time === time
        )

        // Also check if an earlier appointment spans into this slot
        if (!apt) {
            return appointments.find(appt => {
                if (appt.appointment_date !== dateStr) return false
                const aptStartTime = appt.appointment_time
                const duration = appt.duration || 60
                const [aptHour, aptMin] = aptStartTime.split(':').map(Number)
                const [slotHour, slotMin] = time.split(':').map(Number)
                const aptStartMinutes = aptHour * 60 + aptMin
                const slotMinutes = slotHour * 60 + slotMin
                const aptEndMinutes = aptStartMinutes + duration

                // Check if this slot falls within the appointment duration
                return slotMinutes >= aptStartMinutes && slotMinutes < aptEndMinutes
            })
        }
        return apt
    }

    const dayCount = datesToRender.length
    const gridTemplateStyle = { gridTemplateColumns: `repeat(${dayCount + 1}, minmax(0, 1fr))` }

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-4 gap-2">
                <button
                    onClick={handlePrevious}
                    className="btn-brand py-3 px-4"
                >
                    ← {t('calendar.previous')}
                </button>

                <div className="text-center flex-1">
                    <div className="font-bold text-gray-800 text-lg">
                        {getWeekRangeText(weekOffset, resolvedLocale)}
                    </div>
                    {weekOffset !== 0 && (
                        <button
                            onClick={handleToday}
                            className="text-sm text-brand-primary hover:underline mt-1"
                        >
                            {t('calendar.today')}
                        </button>
                    )}
                </div>

                <button
                    onClick={handleNext}
                    className="btn-brand py-3 px-4"
                >
                    {t('calendar.next')} →
                </button>
            </div>

            {/* Instructions */}
            <div className="mb-4 p-3 bg-brand-secondary-soft rounded-lg border-l-4 border-brand-secondary">
                <p className="text-sm font-semibold text-brand-secondary">
                    {t('calendar.instructions')}
                </p>
            </div>

            {/* Calendar Grid with Time Slots */}
            <div className="overflow-x-auto">
                <div className={compactView ? 'min-w-full' : 'min-w-[900px]'}>
                    {/* Day Headers */}
                    <div className="grid gap-1 mb-2" style={gridTemplateStyle}>
                        <div className="text-center font-bold text-gray-700 p-2">
                            {t('calendar.timeColumn')}
                        </div>
                        {datesToRender.map((date, i) => {
                            const isToday = date.toDateString() === new Date().toDateString()
                            return (
                                <div key={i} className="text-center">
                                    <div className="font-bold text-gray-700">
                                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div
                                        className={`text-sm ${isToday
                                            ? 'bg-brand-primary text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto font-bold'
                                            : 'text-gray-600'
                                            }`}
                                    >
                                        {date.getDate()}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Time Slots Grid */}
                    {timeSlots.map((time) => (
                        <div key={time} className="grid gap-1 mb-1" style={gridTemplateStyle}>
                            {/* Time Label */}
                            <div className="text-center text-sm font-bold text-gray-700 p-2 bg-gray-100 rounded flex items-center justify-center">
                                {formatTime(time, resolvedLocale)}
                            </div>

                            {/* Day Cells */}
                            {datesToRender.map((date, i) => {
                                const apt = getAppointmentAtSlot(date, time)
                                const isToday = date.toDateString() === new Date().toDateString()

                                if (apt) {
                                    const customerName = apt.customers?.name || t('appointmentCard.unknownCustomer')
                                    const petName = apt.pets?.name || t('appointmentCard.unknownPet')
                                    const petBreed = apt.pets?.breed
                                    const petPhoto = apt.pets?.photo_url
                                    const serviceName = apt.services?.name || t('appointmentCard.unknownService')
                                    const address = apt.customers?.address
                                    return (
                                        <div
                                            key={i}
                                            className={`p-2 rounded cursor-pointer hover:shadow-lg transition-all border-2 ${apt.status === 'completed'
                                                ? 'bg-brand-accent-soft border-brand-accent'
                                                : 'bg-brand-primary-soft border-brand-primary'
                                                } ${isToday ? 'ring-2 ring-[color:var(--brand-primary)]' : ''}`}
                                            onClick={() => handleAppointmentClick(apt)}
                                        >
                                            {petPhoto && (
                                                <div className="flex justify-center mb-1">
                                                    <img
                                                        src={petPhoto}
                                                        alt={t('appointmentCard.labels.petPhotoAlt', { pet: petName })}
                                                        className="w-10 h-10 rounded-full object-cover border border-white shadow-sm"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            )}
                                            <div className="text-xs font-bold text-gray-800 truncate">
                                                {customerName}
                                            </div>
                                            <div className="text-xs text-gray-700 truncate">
                                                {petName}
                                                {petBreed && (
                                                    <span className="text-gray-500"> ({petBreed})</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-600 truncate">
                                                {serviceName}
                                            </div>
                                            {address && (
                                                <a
                                                    href={getGoogleMapsLink(address)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-brand-primary hover:underline flex items-center gap-1 mt-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {t('calendar.mapLink')}
                                                </a>
                                            )}
                                            {apt.status === 'completed' && (
                                                <div className="text-xs font-bold text-brand-accent mt-1">
                                                    ✓
                                                </div>
                                            )}
                                        </div>
                                    )
                                } else {
                                    return (
                                        <div
                                            key={i}
                                            className={`p-2 rounded cursor-pointer hover:bg-gray-200 transition-all border-2 border-dashed border-gray-300 min-h-[80px] flex items-center justify-center ${isToday ? 'bg-brand-primary-soft' : 'bg-gray-50'
                                                }`}
                                            onClick={() => handleSlotClick(date, time)}
                                        >
                                            <span className="text-xs text-gray-400 hover:text-gray-600">
                                                {t('calendar.add')}
                                            </span>
                                        </div>
                                    )
                                }
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-brand-primary-soft border-2 border-brand-primary rounded"></div>
                    <span>{t('calendar.legend.scheduled')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-brand-accent-soft border-2 border-brand-accent rounded"></div>
                    <span>{t('calendar.legend.completed')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded"></div>
                    <span>{t('calendar.legend.available')}</span>
                </div>
            </div>
        </div>
    )
}
