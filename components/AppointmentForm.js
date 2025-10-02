// ============================================
// FILE: components/AppointmentForm.js
// Add/edit appointment form component
// ============================================

import { useState } from 'react'

export default function AppointmentForm({ onSubmit, onCancel, initialData = null }) {
    const [formData, setFormData] = useState(
        initialData || {
            customer_name: '',
            pet_name: '',
            phone: '',
            service: '',
            appointment_date: '',
            appointment_time: '',
            notes: ''
        }
    )

    const isEditing = !!initialData

    // Predefined services
    const services = [
        'Full Groom',
        'Bath Only',
        'Nail Trim',
        'Teeth Cleaning',
        'De-shedding Treatment',
        'Flea Treatment',
        'Other'
    ]

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-indigo-500">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
                {isEditing ? 'Edit Appointment' : 'New Appointment'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                            Customer Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.customer_name}
                            onChange={(e) =>
                                setFormData({ ...formData, customer_name: e.target.value })
                            }
                            className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                            Pet Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.pet_name}
                            onChange={(e) => setFormData({ ...formData, pet_name: e.target.value })}
                            className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
                            placeholder="Max"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                            Phone Number *
                        </label>
                        <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
                            placeholder="+351 912 345 678"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                            Service *
                        </label>
                        <select
                            required
                            value={formData.service}
                            onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                            className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 font-medium"
                        >
                            <option value="">Select a service...</option>
                            {services.map((service) => (
                                <option key={service} value={service}>
                                    {service}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Date *</label>
                        <input
                            type="date"
                            required
                            value={formData.appointment_date}
                            onChange={(e) =>
                                setFormData({ ...formData, appointment_date: e.target.value })
                            }
                            className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Time *</label>
                        <input
                            type="time"
                            required
                            value={formData.appointment_time}
                            onChange={(e) =>
                                setFormData({ ...formData, appointment_time: e.target.value })
                            }
                            className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 font-medium"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">Notes</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
                        placeholder="Any special requests or notes..."
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition duration-200 text-xl"
                >
                    {isEditing ? '💾 Update Appointment' : '💾 Save Appointment'}
                </button>
            </form>
        </div>
    )
}
