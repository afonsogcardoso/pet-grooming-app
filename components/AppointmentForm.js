// ============================================
// FILE: components/AppointmentForm.js
// ============================================

import { useState, useEffect } from 'react'
import { loadCustomers, loadPetsByCustomer, createCustomer, createPet } from '@/lib/customerService'

export default function AppointmentForm({ onSubmit, onCancel, initialData = null }) {
    const [customers, setCustomers] = useState([])
    const [pets, setPets] = useState([])
    const [loadingCustomers, setLoadingCustomers] = useState(true)
    const [loadingPets, setLoadingPets] = useState(false)
    const [showCustomerModal, setShowCustomerModal] = useState(false)
    const [showPetModal, setShowPetModal] = useState(false)

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

    // Customer modal form data
    const [customerFormData, setCustomerFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
    })

    // Pet modal form data
    const [petFormData, setPetFormData] = useState({
        name: '',
        breed: '',
        age: '',
        weight: '',
        medical_notes: ''
    })

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

    // Generate 24h time slots in 30-minute increments
    const generateTimeSlots = () => {
        const slots = []
        for (let hour = 8; hour < 20; hour++) {
            for (let minute of [0, 30]) {
                const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
                slots.push(timeString)
            }
        }
        return slots
    }

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

    async function handleCreateCustomer(e) {
        e.preventDefault()
        const { data, error } = await createCustomer(customerFormData)

        if (error) {
            alert('Error creating customer: ' + error.message)
        } else {
            // Add new customer to list
            const newCustomer = data[0]
            setCustomers([...customers, newCustomer])
            // Auto-select the new customer
            handleCustomerChange(newCustomer.id)
            // Reset modal form
            setCustomerFormData({
                name: '',
                phone: '',
                email: '',
                address: '',
                notes: ''
            })
            setShowCustomerModal(false)
        }
    }

    async function handleCreatePet(e) {
        e.preventDefault()
        const petData = {
            customer_id: formData.customer_id,
            name: petFormData.name,
            breed: petFormData.breed,
            age: petFormData.age ? parseInt(petFormData.age) : null,
            weight: petFormData.weight ? parseFloat(petFormData.weight) : null,
            medical_notes: petFormData.medical_notes
        }

        const { data, error } = await createPet(petData)

        if (error) {
            alert('Error creating pet: ' + error.message)
        } else {
            // Add new pet to list
            const newPet = data[0]
            setPets([...pets, newPet])
            // Auto-select the new pet
            handlePetChange(newPet.id)
            // Reset modal form
            setPetFormData({
                name: '',
                breed: '',
                age: '',
                weight: '',
                medical_notes: ''
            })
            setShowPetModal(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow-xl p-6 border-2 border-indigo-500">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                        {isEditing ? 'Edit Appointment' : 'New Appointment'}
                    </h3>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
                        title="Close"
                    >
                        ✕
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Customer Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                Customer *
                            </label>
                            <div className="flex gap-2">
                                {loadingCustomers ? (
                                    <div className="flex-1 px-4 py-4 border-2 border-gray-400 rounded-lg text-gray-600 bg-gray-50">
                                        Loading customers...
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={formData.customer_id}
                                        onChange={(e) => handleCustomerChange(e.target.value)}
                                        className="flex-1 px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 font-medium"
                                    >
                                        <option value="">Select a customer...</option>
                                        {customers.map((customer) => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.name} - {customer.phone}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(true)}
                                    className="px-4 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition duration-200 whitespace-nowrap"
                                    title="Add New Customer"
                                >
                                    + New
                                </button>
                            </div>
                        </div>

                        {/* Pet Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">Pet *</label>
                            <div className="flex gap-2">
                                {!formData.customer_id ? (
                                    <div className="flex-1 px-4 py-4 border-2 border-gray-400 rounded-lg text-gray-600 bg-gray-50">
                                        Select a customer first
                                    </div>
                                ) : loadingPets ? (
                                    <div className="flex-1 px-4 py-4 border-2 border-gray-400 rounded-lg text-gray-600 bg-gray-50">
                                        Loading pets...
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={formData.pet_id}
                                        onChange={(e) => handlePetChange(e.target.value)}
                                        className="flex-1 px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 font-medium"
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
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!formData.customer_id) {
                                            alert('Please select a customer first')
                                            return
                                        }
                                        setShowPetModal(true)
                                    }}
                                    disabled={!formData.customer_id}
                                    className="px-4 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition duration-200 whitespace-nowrap disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    title="Add New Pet"
                                >
                                    + New
                                </button>
                            </div>
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

                        {/* Time - UPDATED TO 24H FORMAT WITH 30-MIN INCREMENTS */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">Time *</label>
                            <select
                                required
                                value={formData.appointment_time}
                                onChange={(e) =>
                                    setFormData({ ...formData, appointment_time: e.target.value })
                                }
                                className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 font-medium"
                            >
                                <option value="">Select time...</option>
                                {generateTimeSlots().map((time) => (
                                    <option key={time} value={time}>
                                        {time}
                                    </option>
                                ))}
                            </select>
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

            {/* Customer Creation Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Customer</h3>
                        <form onSubmit={handleCreateCustomer} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        Customer Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={customerFormData.name}
                                        onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base bg-white text-gray-900 font-medium"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={customerFormData.phone}
                                        onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base bg-white text-gray-900 font-medium"
                                        placeholder="+351 912 345 678"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-800 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={customerFormData.email}
                                        onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base bg-white text-gray-900 font-medium"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        Address (Service Location) * 📍
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={customerFormData.address}
                                        onChange={(e) => setCustomerFormData({ ...customerFormData, address: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base bg-white text-gray-900 font-medium"
                                        placeholder="Full address or Google Maps link"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Notes</label>
                                <textarea
                                    value={customerFormData.notes}
                                    onChange={(e) => setCustomerFormData({ ...customerFormData, notes: e.target.value })}
                                    rows="2"
                                    className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base bg-white text-gray-900 font-medium"
                                    placeholder="Any special notes..."
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200"
                                >
                                    💾 Save Customer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCustomerModal(false)
                                        setCustomerFormData({
                                            name: '',
                                            phone: '',
                                            email: '',
                                            address: '',
                                            notes: ''
                                        })
                                    }}
                                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pet Creation Modal */}
            {showPetModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">🐾 Add New Pet</h3>
                        <form onSubmit={handleCreatePet} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        Pet Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={petFormData.name}
                                        onChange={(e) => setPetFormData({ ...petFormData, name: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base bg-white text-gray-900 font-medium"
                                        placeholder="Max"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">Breed</label>
                                    <input
                                        type="text"
                                        value={petFormData.breed}
                                        onChange={(e) => setPetFormData({ ...petFormData, breed: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base bg-white text-gray-900 font-medium"
                                        placeholder="Golden Retriever"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        Age (years)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="30"
                                        value={petFormData.age}
                                        onChange={(e) => setPetFormData({ ...petFormData, age: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base bg-white text-gray-900 font-medium"
                                        placeholder="5"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        Weight (kg)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="200"
                                        value={petFormData.weight}
                                        onChange={(e) => setPetFormData({ ...petFormData, weight: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base bg-white text-gray-900 font-medium"
                                        placeholder="25.5"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    Medical Notes
                                </label>
                                <textarea
                                    value={petFormData.medical_notes}
                                    onChange={(e) => setPetFormData({ ...petFormData, medical_notes: e.target.value })}
                                    rows="2"
                                    className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base bg-white text-gray-900 font-medium"
                                    placeholder="Allergies, medications, special needs..."
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200"
                                >
                                    💾 Save Pet
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPetModal(false)
                                        setPetFormData({
                                            name: '',
                                            breed: '',
                                            age: '',
                                            weight: '',
                                            medical_notes: ''
                                        })
                                    }}
                                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
