// ============================================
// FILE: components/CalendarView.js
// Calendar week view with time slots - click to create appointments
// ============================================

import { getWeekDates, getWeekRangeText, formatTime } from '@/utils/dateUtils'
import { getGoogleMapsLink } from '@/utils/addressUtils'

export default function CalendarView({ appointments, weekOffset, onWeekChange, onComplete, onCreateAtSlot }) {
    const weekDates = getWeekDates(weekOffset)

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
        if (apt.status === 'completed') {
            alert(`Completed: ${apt.customer_name} - ${apt.pet_name}`)
            return
        }

        if (
            confirm(
                `${apt.customer_name} - ${apt.pet_name}\n${formatTime(apt.appointment_time)}\n${apt.service}\n\nMark as completed?`
            )
        ) {
            onComplete(apt.id)
        }
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

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-4 gap-2">
                <button
                    onClick={handlePrevious}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                >
                    ← Previous
                </button>

                <div className="text-center flex-1">
                    <div className="font-bold text-gray-800 text-lg">
                        {getWeekRangeText(weekOffset)}
                    </div>
                    {weekOffset !== 0 && (
                        <button
                            onClick={handleToday}
                            className="text-sm text-indigo-600 hover:underline mt-1"
                        >
                            Back to This Week
                        </button>
                    )}
                </div>

                <button
                    onClick={handleNext}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                >
                    Next →
                </button>
            </div>

            {/* Instructions */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm font-semibold text-blue-900">
                    💡 Click on any empty time slot to create a new appointment
                </p>
            </div>

            {/* Calendar Grid with Time Slots */}
            <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                    {/* Day Headers */}
                    <div className="grid grid-cols-8 gap-1 mb-2">
                        <div className="text-center font-bold text-gray-700 p-2">Time</div>
                        {weekDates.map((date, i) => {
                            const isToday = date.toDateString() === new Date().toDateString()
                            return (
                                <div key={i} className="text-center">
                                    <div className="font-bold text-gray-700">
                                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div
                                        className={`text-sm ${isToday
                                            ? 'bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto font-bold'
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
                        <div key={time} className="grid grid-cols-8 gap-1 mb-1">
                            {/* Time Label */}
                            <div className="text-center text-sm font-bold text-gray-700 p-2 bg-gray-100 rounded flex items-center justify-center">
                                {formatTime(time)}
                            </div>

                            {/* Day Cells */}
                            {weekDates.map((date, i) => {
                                const apt = getAppointmentAtSlot(date, time)
                                const isToday = date.toDateString() === new Date().toDateString()

                                if (apt) {
                                    return (
                                        <div
                                            key={i}
                                            className={`p-2 rounded cursor-pointer hover:shadow-lg transition-all border-2 ${apt.status === 'completed'
                                                ? 'bg-green-100 border-green-500'
                                                : 'bg-indigo-100 border-indigo-500'
                                                } ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                                            onClick={() => handleAppointmentClick(apt)}
                                        >
                                            <div className="text-xs font-bold text-gray-800 truncate">
                                                {apt.customer_name}
                                            </div>
                                            <div className="text-xs text-gray-700 truncate">
                                                {apt.pet_name}
                                            </div>
                                            <div className="text-xs text-gray-600 truncate">
                                                {apt.service}
                                            </div>
                                            {apt.customers?.address && (
                                                <a
                                                    href={getGoogleMapsLink(apt.customers.address)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    📍 Map
                                                </a>
                                            )}
                                            {apt.status === 'completed' && (
                                                <div className="text-xs font-bold text-green-700 mt-1">
                                                    ✓
                                                </div>
                                            )}
                                        </div>
                                    )
                                } else {
                                    return (
                                        <div
                                            key={i}
                                            className={`p-2 rounded cursor-pointer hover:bg-gray-200 transition-all border-2 border-dashed border-gray-300 min-h-[80px] flex items-center justify-center ${isToday ? 'bg-blue-50' : 'bg-gray-50'
                                                }`}
                                            onClick={() => handleSlotClick(date, time)}
                                        >
                                            <span className="text-xs text-gray-400 hover:text-gray-600">
                                                + Add
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
                    <div className="w-4 h-4 bg-indigo-100 border-2 border-indigo-500 rounded"></div>
                    <span>Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
                    <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded"></div>
                    <span>Available (Click to book)</span>
                </div>
            </div>
        </div>
    )
}
