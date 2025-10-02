// ============================================
// FILE: components/AppointmentCard.js
// Single appointment card component
// ============================================

import { formatDate, formatTime } from '@/utils/dateUtils'

export default function AppointmentCard({ appointment, onComplete, onDelete, onEdit }) {
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
                                ✓ Completed
                            </span>
                        )}
                    </div>

                    <div className="text-gray-700 space-y-1 text-base">
                        <div className="flex items-center gap-2">
                            <span className="font-bold">🐕 Pet:</span>
                            <span className="font-medium">{appointment.pet_name}</span>
                        </div>
                        {appointment.phone && (
                            <div className="flex items-center gap-2">
                                <span className="font-bold">📱 Phone:</span>
                                <a
                                    href={`tel:${appointment.phone}`}
                                    className="font-medium text-indigo-600 hover:underline"
                                >
                                    {appointment.phone}
                                </a>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <span className="font-bold">✂️ Service:</span>
                            <span className="font-medium">{appointment.service}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">📅 Date:</span>
                            <span className="font-bold text-indigo-600">
                                {formatDate(appointment.appointment_date)} at{' '}
                                {formatTime(appointment.appointment_time)}
                            </span>
                        </div>
                        {appointment.notes && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <span className="font-bold">📝 Notes:</span>
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
                        ✏️ Edit
                    </button>
                    {appointment.status !== 'completed' && (
                        <button
                            onClick={() => onComplete(appointment.id)}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-5 rounded-lg transition duration-200 text-sm whitespace-nowrap shadow-md"
                        >
                            ✓ Complete
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(appointment.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-5 rounded-lg transition duration-200 text-sm whitespace-nowrap shadow-md"
                    >
                        🗑 Delete
                    </button>
                </div>
            </div>
        </div>
    )
}
