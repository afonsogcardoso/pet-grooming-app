// ============================================
// FILE: components/CalendarView.js
// Calendar week view with time slots - click to create appointments
// ============================================

'use client'

import Image from 'next/image'
import { useMemo } from 'react'
import { getWeekDates, getWeekRangeText, formatTime } from '@/utils/dateUtils'
import { getGoogleMapsLink } from '@/utils/addressUtils'
import { useTranslation } from '@/components/TranslationProvider'

export default function CalendarView({ appointments, weekOffset, onWeekChange, onComplete, onEdit, onCreateAtSlot }) {
    const { t, resolvedLocale } = useTranslation()
    const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
    const datesToRender = weekDates

    const SLOT_INTERVAL_MINUTES = 30
    const START_TIME_MINUTES = 9 * 60 // 09:00
    const END_TIME_MINUTES = 18 * 60 // 18:00

    // Time slots from 9 AM to 6 PM in 30-minute intervals
    const timeSlots = useMemo(() => {
        const slots = []
        for (let minutes = START_TIME_MINUTES; minutes <= END_TIME_MINUTES; minutes += SLOT_INTERVAL_MINUTES) {
            const hour = Math.floor(minutes / 60)
            const minute = minutes % 60
            slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
        }
        return slots
    }, [START_TIME_MINUTES, END_TIME_MINUTES, SLOT_INTERVAL_MINUTES])
    const SLOT_HEIGHT = 80
    const SLOT_GAP = 4
    const TOTAL_DAY_HEIGHT = timeSlots.length * SLOT_HEIGHT + SLOT_GAP * (timeSlots.length - 1)
    const TIME_COLUMN_WIDTH = 120

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

    const normalizeTimeToSlot = (time) => {
        if (!time) return null
        const [hour, minute] = time.split(':')
        if (hour === undefined || minute === undefined) return null
        return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
    }

    const findAppointmentAtSlot = (date, time) => {
        const dateStr = date.toISOString().split('T')[0]
        // Find appointment that starts at this time
        const apt = appointments.find(
            apt => apt.appointment_date === dateStr && normalizeTimeToSlot(apt.appointment_time) === time
        )

        if (apt) return apt

        // Check if an earlier appointment spans into this slot
        return appointments.find(appt => {
            if (appt.appointment_date !== dateStr) return false
            const aptStartTime = appt.appointment_time
            const duration = appt.duration || 60
            const [aptHour, aptMin] = aptStartTime.split(':').map(Number)
            const [slotHour, slotMin] = time.split(':').map(Number)
            const aptStartMinutes = aptHour * 60 + aptMin
            const slotMinutes = slotHour * 60 + slotMin
            const aptEndMinutes = aptStartMinutes + duration

            return slotMinutes >= aptStartMinutes && slotMinutes < aptEndMinutes
        })
    }

    const handleSlotClick = (date, time) => {
        const dateStr = date.toISOString().split('T')[0]
        const existingApt = findAppointmentAtSlot(date, time)

        if (existingApt) {
            handleAppointmentClick(existingApt)
        } else if (onCreateAtSlot) {
            onCreateAtSlot(dateStr, time)
        }
    }

    const getAppointmentsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0]
        return appointments
            .filter((apt) => apt.appointment_date === dateStr)
            .map((apt) => {
                const normalizedTime = normalizeTimeToSlot(apt.appointment_time)
                if (!normalizedTime) return null
                const [hour, minute] = normalizedTime.split(':').map(Number)
                const minutesFromStart = hour * 60 + minute - START_TIME_MINUTES
                if (Number.isNaN(minutesFromStart) || minutesFromStart < 0) return null
                const slotIndex = minutesFromStart / SLOT_INTERVAL_MINUTES
                const durationMinutes = Math.max(SLOT_INTERVAL_MINUTES, apt.duration || 60)
                const slotsToRender = Math.max(1, durationMinutes / SLOT_INTERVAL_MINUTES)
                return { ...apt, slotIndex, slotsToRender }
            })
            .filter(Boolean)
            .sort((a, b) => a.slotIndex - b.slotIndex)
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-4 gap-2">
                <button
                    onClick={handlePrevious}
                    className="btn-brand py-3 px-4"
                    aria-label={t('calendar.previous')}
                >
                    <span aria-hidden="true">←</span>
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
                    aria-label={t('calendar.next')}
                >
                    <span aria-hidden="true">→</span>
                </button>
            </div>

            {/* Instructions */}
            <div className="mb-4 p-3 bg-brand-secondary-soft rounded-lg border-l-4 border-brand-secondary">
                <p className="text-sm font-semibold text-brand-secondary">
                    {t('calendar.instructions')}
                </p>
            </div>

            {/* Calendar Grid with Time Slots */}
            <div className="overflow-x-auto -mx-2 sm:mx-0">
                <div className="min-w-[720px] md:min-w-0">
                    {/* Day Headers */}
                    <div className="flex gap-1 mb-2">
                        <div
                            className="text-center font-bold text-gray-700 p-2 bg-gray-100 rounded"
                            style={{ width: TIME_COLUMN_WIDTH }}
                        >
                            {t('calendar.timeColumn')}
                        </div>
                        {datesToRender.map((date, i) => {
                            const isToday = date.toDateString() === new Date().toDateString()
                            return (
                                <div key={i} className="flex-1 text-center">
                                    <div className="font-bold text-gray-700">
                                        {date.toLocaleDateString(resolvedLocale, { weekday: 'short' })}
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
                    <div className="flex gap-1">
                        {/* Time Labels */}
                        <div className="flex flex-col gap-1 shrink-0" style={{ width: TIME_COLUMN_WIDTH }}>
                            {timeSlots.map((time, index) => (
                                <div
                                    key={time}
                                    className="text-center text-sm font-bold text-gray-700 p-2 bg-gray-100 rounded flex items-center justify-center"
                                    style={{
                                        height: SLOT_HEIGHT
                                    }}
                                >
                                    {formatTime(time, resolvedLocale)}
                                </div>
                            ))}
                        </div>

                        {/* Day Columns */}
                        {datesToRender.map((date, columnIndex) => {
                            const isToday = date.toDateString() === new Date().toDateString()
                            const appointmentsForDay = getAppointmentsForDate(date)
                            const dateStr = date.toISOString().split('T')[0]

                            return (
                                <div key={columnIndex} className="flex-1">
                                    <div className="relative" style={{ minHeight: TOTAL_DAY_HEIGHT }}>
                                        <div className="flex flex-col gap-1">
                                            {timeSlots.map((time, rowIndex) => (
                                                <div
                                                    key={`${dateStr}-${time}`}
                                                    className={`p-2 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 transition-all cursor-pointer ${isToday ? 'bg-brand-primary-soft' : 'bg-gray-50'
                                                        } hover:bg-gray-200 hover:text-gray-600`}
                                                    style={{
                                                        height: SLOT_HEIGHT
                                                    }}
                                                    onClick={() => handleSlotClick(date, time)}
                                                >
                                                    {t('calendar.add')}
                                                </div>
                                            ))}
                                        </div>

                                        {appointmentsForDay.map((apt) => {
                                            const customerName = apt.customers?.name || t('appointmentCard.unknownCustomer')
                                            const petName = apt.pets?.name || t('appointmentCard.unknownPet')
                                            const petBreed = apt.pets?.breed
                                            const petPhoto = apt.pets?.photo_url
                                            const serviceName = apt.services?.name || t('appointmentCard.unknownService')
                                            const address = apt.customers?.address
                                            const top = apt.slotIndex * (SLOT_HEIGHT + SLOT_GAP)
                                            const height = apt.slotsToRender * SLOT_HEIGHT + (apt.slotsToRender - 1) * SLOT_GAP
                                            const isCompact = apt.slotsToRender === 1

                                            return (
                                                <div
                                                    key={apt.id}
                                                    className={`absolute left-0 right-0 p-2 rounded cursor-pointer hover:shadow-lg transition-all border-2 ${apt.status === 'completed'
                                                        ? 'bg-brand-accent-soft border-brand-accent'
                                                        : 'bg-brand-primary-soft border-brand-primary'
                                                        } ${isToday ? 'ring-2 ring-[color:var(--brand-primary)]' : ''}`}
                                                    style={{
                                                        top,
                                                        height
                                                    }}
                                                    onClick={() => handleAppointmentClick(apt)}
                                                >
                                                    <div className={isCompact ? 'flex items-center gap-3 h-full' : ''}>
                                                        {petPhoto && (
                                                            <div className={isCompact ? '' : 'flex justify-center mb-1'}>
                                                                <Image
                                                                    src={petPhoto}
                                                                    alt={t('appointmentCard.labels.petPhotoAlt', { pet: petName })}
                                                                    width={48}
                                                                    height={48}
                                                                    className={`rounded-full object-cover border border-white shadow-sm ${isCompact ? 'w-12 h-12' : 'w-10 h-10 mx-auto'}`}
                                                                    loading="lazy"
                                                                    decoding="async"
                                                                    sizes="48px"
                                                                    unoptimized
                                                                />
                                                            </div>
                                                        )}
                                                        <div className={`flex-1 ${isCompact ? 'min-w-0' : ''}`}>
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
                                                                    className={`text-xs text-brand-primary hover:underline flex items-center gap-1 ${isCompact ? 'mt-0' : 'mt-1'}`}
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
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
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
