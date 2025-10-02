// ============================================
// FILE: components/AppointmentList.js
// List of appointments component
// ============================================

import AppointmentCard from './AppointmentCard'

export default function AppointmentList({ appointments, filter, onComplete, onDelete, onEdit }) {
    if (appointments.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {filter === 'all' ? 'No appointments yet' : `No ${filter} appointments`}
                </h3>
                <p className="text-gray-500">
                    {filter === 'all'
                        ? 'Click "New Appointment" to get started!'
                        : 'Try changing the filter above'}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {appointments.map((appointment) => (
                <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    onEdit={onEdit}
                />
            ))}
        </div>
    )
}
