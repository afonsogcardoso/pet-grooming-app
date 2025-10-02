// ============================================
// FILE: components/AppointmentForm.js
// Add/edit appointment form component with customer/pet selection
// ============================================

import { useState, useEffect } from 'react'
import { loadCustomers, loadPetsByCustomer } from '@/lib/customerService'

export default function AppointmentForm({ onSubmit, onCancel, initialData = null }) {
    const [customers, setCustomers] = useState([])
    const [pets, setPets] = useState([])
    const [loadingCustomers, setLoadingCustomers] = useState(true)
    const [loadingPets, setLoadingPets] = useState(false)

    const [formData, setFormData] = useState(
        initialData || {
            customer_id: '',
            pet_id: '',
            customer_name: '',
            pet_name: '',
            phone: '',
            service: '',
            appointment_date: '',
            appointment_time: '',
            duration: 60,
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

    useEffect(() => {
        fetchCustomers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (formData.customer_id) {
            fetchPets(formData.customer_id)
        } else {
            setPets([])
            setFormData((prev) => ({ ...prev, pet_id: '' }))
        }
    }, [formData.customer_id])

    async function fetchCustomers() {
        setLoadingCustomers(true)
        const { data, error } = await loadCustomers()

        if (error) {
            console.error('Error loading customers:', error)
        } else {
            setCustomers(data)
            // If editing and has customer_id, fetch pets
            if (initialData?.customer_id) {
                fetchPets(initialData.customer_id)
            }
        }
        setLoadingCustomers(false)
    }

    async function fetchPets(customerId) {
        setLoadingPets(true)
        const { data, error } = await loadPetsByCustomer(customerId)

        if (error) {
            console.error('Error loading pets:', error)
        } else {
            setPets(data)
        }
        setLoadingPets(false)
    }

    function handleCustomerChange(customerId) {
        const customer = customers.find((c) => c.id === customerId)
        setFormData({
            ...formData,
            customer_id: customerId,
            customer_name: customer?.name || '',
            phone: customer?.phone || '',
            pet_id: '' // Reset pet selection
        })
    }

    function handlePetChange(petId) {
        const pet = pets.find((p) => p.id === petId)
        setFormData({
            ...formData,
            pet_id: petId,
            pet_name: pet?.name || ''
        })
    }

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
                    {/* Customer Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                            Customer *
                        </label>
                        {loadingCustomers ? (
                            <div className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg text-gray-600 bg-gray-50">
                                Loading customers...
                            </div>
                        ) : (
                            <select
                                required
                                value={formData.customer_id}
                                onChange={(e) => handleCustomerChange(e.target.value)}
                                className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 font-medium"
                            >
                                <option value="">Select a customer...</option>
                                {customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name} - {customer.phone}
                                    </option>
                                ))}
                            </select>
                        )}
                        <p className="text-xs text-gray-600 mt-1">
                            Don&apos;t see the customer?{' '}
                            <a
                                href="/customers"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:underline font-semibold"
                            >
                                Add them here
                            </a>
                        </p>
                    </div>

                    {/* Pet Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Pet *</label>
                        {!formData.customer_id ? (
                            <div className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg text-gray-600 bg-gray-50">
                                Select a customer first
                            </div>
                        ) : loadingPets ? (
                            <div className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg text-gray-600 bg-gray-50">
                                Loading pets...
                            </div>
                        ) : pets.length === 0 ? (
                            <div className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg text-gray-600 bg-gray-50">
                                No pets found. Add one in{' '}
                                <a
                                    href="/customers"
                                    target="_blank"
                                    className="text-indigo-600 hover:underline font-semibold"
                                >
                                    Customers
                                </a>
                            </div>
                        ) : (
                            <select
                                required
                                value={formData.pet_id}
                                onChange={(e) => handlePetChange(e.target.value)}
                                className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 font-medium"
                            >
                                <option value="">Select a pet...</option>
                                {pets.map((pet) => (
                                    <option key={pet.id} value={pet.id}>
                                        {pet.name}
                                        {pet.breed && ` (${pet.breed})`}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Service Selection */}
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

                    {/* Duration Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                            Duration *
                        </label>
                        <select
                            required
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                            className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 font-medium"
                        >
                            <option value="30">30 minutes</option>
                            <option value="60">1 hour (default)</option>
                            <option value="90">1 hour 30 minutes</option>
                        </select>
                    </div>

                    {/* Phone Display (read-only) */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            readOnly
                            className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-lg bg-gray-50 text-gray-700 font-medium cursor-not-allowed"
                            placeholder="Will autofill from customer"
                        />
                    </div>

                    {/* Date */}
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

                    {/* Time */}
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

                {/* Notes */}
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
