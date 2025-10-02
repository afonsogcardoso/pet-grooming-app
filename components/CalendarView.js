// ============================================
// FILE: components/CalendarView.js
// Calendar week view component
// ============================================

import { getWeekDates, getWeekRangeText, getAppointmentsForDate, formatTime } from '@/utils/dateUtils'

export default function CalendarView({ appointments, weekOffset, onWeekChange, onComplete }) {
    const weekDates = getWeekDates(weekOffset)

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
        if (
            confirm(
                `${apt.customer_name} - ${apt.pet_name}\n${formatTime(apt.appointment_time)}\n${apt.service}\n\nMark as completed?`
            )
        ) {
            onComplete(apt.id)
        }
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

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {weekDates.map((date, i) => (
                            <div key={i} className="text-center">
                                <div className="font-bold text-gray-700">
                                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div
                                    className={`text-sm ${date.toDateString() === new Date().toDateString()
                                            ? 'bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto font-bold'
                                            : 'text-gray-600'
                                        }`}
                                >
                                    {date.getDate()}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {weekDates.map((date, i) => {
                            const dayAppointments = getAppointmentsForDate(appointments, date)
                            return (
                                <div
                                    key={i}
                                    className="border-2 border-gray-200 rounded-lg p-2 min-h-[200px] bg-gray-50"
                                >
                                    {dayAppointments.length === 0 ? (
                                        <div className="text-center text-gray-400 text-sm mt-8">
                                            No appointments
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {dayAppointments.map((apt) => (
                                                <div
                                                    key={apt.id}
                                                    className={`p-2 rounded text-xs cursor-pointer hover:shadow-md transition ${apt.status === 'completed'
                                                            ? 'bg-green-100 border-l-4 border-green-500'
                                                            : 'bg-indigo-100 border-l-4 border-indigo-500'
                                                        }`}
                                                    onClick={() => handleAppointmentClick(apt)}
                                                >
                                                    <div className="font-bold text-gray-800">
                                                        {formatTime(apt.appointment_time)}
                                                    </div>
                                                    <div className="text-gray-700">
                                                        {apt.customer_name}
                                                    </div>
                                                    <div className="text-gray-600">{apt.pet_name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
