// ============================================
// FILE: components/AppointmentForm.js
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { loadCustomers, loadPetsByCustomer, createCustomer, createPet } from '@/lib/customerService'
import { loadServices, createService } from '@/lib/serviceService'
import { useTranslation } from '@/components/TranslationProvider'

const formatTimeValue = (value) => (value ? value.substring(0, 5) : '')

const buildInitialFormState = (data) => ({
    customer_id: data?.customer_id || '',
    pet_id: data?.pet_id || '',
    service_id: data?.service_id || data?.services?.id || '',
    phone: data?.customers?.phone || '',
    appointment_date: data?.appointment_date || '',
    appointment_time: formatTimeValue(data?.appointment_time),
    duration: data?.duration || 60,
    notes: data?.notes || '',
    status: data?.status || 'scheduled'
})

export default function AppointmentForm({ onSubmit, onCancel, initialData = null }) {
    const { t } = useTranslation()
    const [customers, setCustomers] = useState([])
    const [pets, setPets] = useState([])
    const [loadingCustomers, setLoadingCustomers] = useState(true)
    const [loadingPets, setLoadingPets] = useState(false)
    const [services, setServices] = useState([])
    const [loadingServices, setLoadingServices] = useState(true)
    const [showCustomerModal, setShowCustomerModal] = useState(false)
    const [showPetModal, setShowPetModal] = useState(false)
    const [showServiceModal, setShowServiceModal] = useState(false)

    const [formData, setFormData] = useState(() => buildInitialFormState(initialData))

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
        medical_notes: '' // Ensure this is never null
    })

    const [serviceFormData, setServiceFormData] = useState({
        name: '',
        description: '',
        default_duration: 60,
        price: ''
    })
    const [selectedPetInfo, setSelectedPetInfo] = useState(initialData?.pets || null)

    const isEditing = !!initialData

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
        fetchServicesList()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Update form data when initialData changes (e.g., when editing a different appointment)
    useEffect(() => {
        if (initialData) {
            setFormData(buildInitialFormState(initialData))
            setSelectedPetInfo(initialData.pets || null)
        } else {
            setFormData(buildInitialFormState(null))
            setSelectedPetInfo(null)
        }
    }, [initialData])

    useEffect(() => {
        if (formData.customer_id) {
            fetchPets(formData.customer_id)
        } else {
            setPets([])
            setFormData((prev) => ({ ...prev, pet_id: '' }))
        }
    }, [formData.customer_id])

    useEffect(() => {
        if (!formData.pet_id) {
            setSelectedPetInfo(null)
            return
        }

        const petFromList = pets.find((pet) => pet.id === formData.pet_id)

        if (petFromList) {
            setSelectedPetInfo(petFromList)
        } else if (initialData?.pet_id === formData.pet_id && initialData?.pets) {
            setSelectedPetInfo(initialData.pets)
        }
    }, [formData.pet_id, pets, initialData])

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

    async function fetchServicesList() {
        setLoadingServices(true)
        const { data, error } = await loadServices()

        if (error) {
            console.error('Error loading services:', error)
        } else {
            setServices(data)
        }
        setLoadingServices(false)
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

    function handleCustomerChange(customerId, customerOverride = null) {
        const customer = customerOverride || customers.find((c) => c.id === customerId)
        setFormData((prev) => ({
            ...prev,
            customer_id: customerId,
            phone: customer?.phone || '',
            pet_id: '' // Reset pet selection
        }))
    }

    function handlePetChange(petId) {
        setFormData((prev) => ({
            ...prev,
            pet_id: petId
        }))
    }

    function handleServiceChange(serviceId) {
        const service = services.find((s) => s.id === serviceId)
        setFormData((prev) => ({
            ...prev,
            service_id: serviceId,
            duration: service?.default_duration || prev.duration
        }))
    }

    async function handleCreateCustomer(e) {
        e.preventDefault()
        const { data, error } = await createCustomer(customerFormData)

        if (error) {
            alert(t('customerForm.errors.create', { message: error.message }))
        } else {
            const newCustomer = data[0]
            setCustomers((prev) => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)))
            handleCustomerChange(newCustomer.id, newCustomer)
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

    async function handleCreateService(e) {
        e.preventDefault()
        const payload = {
            name: serviceFormData.name,
            description: serviceFormData.description,
            default_duration: serviceFormData.default_duration || 60,
            price: serviceFormData.price ? parseFloat(serviceFormData.price) : null
        }

        const { data, error } = await createService(payload)

        if (error) {
            alert(t('servicesForm.errors.create', { message: error.message }))
        } else {
            const newService = data[0]
            setServices((prev) => [...prev, newService].sort((a, b) => a.name.localeCompare(b.name)))
            setFormData((prev) => ({
                ...prev,
                service_id: newService.id,
                duration: newService.default_duration || prev.duration
            }))
            setServiceFormData({
                name: '',
                description: '',
                default_duration: 60,
                price: ''
            })
            setShowServiceModal(false)
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
            alert(t('petForm.errors.create', { message: error.message }))
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

        const payload = {
            customer_id: formData.customer_id || null,
            pet_id: formData.pet_id || null,
            service_id: formData.service_id || null,
            appointment_date: formData.appointment_date,
            appointment_time: formData.appointment_time,
            duration: formData.duration,
            notes: formData.notes,
            status: formData.status
        }

        onSubmit(payload)
    }

    return (
        <>
            <div className="modal-card bg-white rounded-lg shadow-xl p-5 sm:p-6 border-2 border-indigo-500">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                        {isEditing ? t('appointmentForm.title.edit') : t('appointmentForm.title.new')}
                    </h3>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
                        title={t('appointmentForm.actions.close')}
                        aria-label={t('appointmentForm.actions.close')}
                    >
                        ✕
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1 sm:mb-2">
                                {t('appointmentForm.fields.date')}
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.appointment_date}
                                onChange={(e) =>
                                    setFormData({ ...formData, appointment_date: e.target.value })
                                }
                                className="w-full px-3 sm:px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-base sm:text-lg bg-white text-gray-900 font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1 sm:mb-2">
                                {t('appointmentForm.fields.time')}
                            </label>
                            <select
                                required
                                value={formData.appointment_time}
                                onChange={(e) =>
                                    setFormData({ ...formData, appointment_time: e.target.value })
                                }
                                className="w-full px-3 sm:px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-base sm:text-lg bg-white text-gray-900 font-medium"
                            >
                                <option value="">{t('appointmentForm.placeholders.selectTime')}</option>
                                {generateTimeSlots().map((time) => (
                                    <option key={time} value={time}>
                                        {time}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Customer Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                {t('appointmentForm.fields.customer')}
                            </label>
                            <div className="flex gap-2">
                                {loadingCustomers ? (
                                    <div className="flex-1 px-4 py-4 border-2 border-gray-400 rounded-lg text-gray-600 bg-gray-50">
                                        {t('appointmentForm.loaders.customers')}
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={formData.customer_id}
                                        onChange={(e) => handleCustomerChange(e.target.value)}
                                className="flex-1 px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-lg bg-white text-gray-900 font-medium"
                                    >
                                        <option value="">
                                            {t('appointmentForm.placeholders.selectCustomer')}
                                        </option>
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
                                    className="px-4 py-4 bg-brand-accent hover:bg-brand-accent-dark text-white font-bold rounded-lg shadow-lg transition duration-200 whitespace-nowrap"
                                    title={t('appointmentForm.tooltips.addCustomer')}
                                >
                                    {t('appointmentForm.buttons.add')}
                                </button>
                            </div>
                        </div>

                        {/* Pet Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                {t('appointmentForm.fields.pet')}
                            </label>
                            <div className="flex gap-2">
                                {!formData.customer_id ? (
                                    <div className="flex-1 px-4 py-4 border-2 border-gray-400 rounded-lg text-gray-600 bg-gray-50">
                                        {t('appointmentForm.placeholders.selectCustomerFirst')}
                                    </div>
                                ) : loadingPets ? (
                                    <div className="flex-1 px-4 py-4 border-2 border-gray-400 rounded-lg text-gray-600 bg-gray-50">
                                        {t('appointmentForm.loaders.pets')}
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={formData.pet_id}
                                        onChange={(e) => handlePetChange(e.target.value)}
                                        className="flex-1 px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-lg bg-white text-gray-900 font-medium"
                                    >
                                        <option value="">
                                            {t('appointmentForm.placeholders.selectPet')}
                                        </option>
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
                                            alert(t('appointmentForm.messages.selectCustomerFirst'))
                                            return
                                        }
                                        setShowPetModal(true)
                                    }}
                                    disabled={!formData.customer_id}
                                    className="px-4 py-4 bg-brand-accent hover:bg-brand-accent-dark text-white font-bold rounded-lg shadow-lg transition duration-200 whitespace-nowrap disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    title={t('appointmentForm.tooltips.addPet')}
                                >
                                    {t('appointmentForm.buttons.add')}
                                </button>
                            </div>
                        </div>

                        {selectedPetInfo?.photo_url && (
                            <div className="md:col-span-2 flex items-center gap-4 bg-brand-primary-soft border border-brand-primary rounded-2xl p-4 shadow-inner">
                                <img
                                    src={selectedPetInfo.photo_url}
                                    alt={selectedPetInfo.name || 'Pet'}
                                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow"
                                />
                                <div>
                                    <p className="text-xs font-semibold uppercase text-brand-primary">
                                        {t('appointmentForm.fields.pet')}
                                    </p>
                                    <p className="text-lg font-bold text-gray-800">
                                        {selectedPetInfo.name}
                                        {selectedPetInfo.breed && (
                                            <span className="text-sm font-medium text-gray-500">
                                                {' '}
                                                ({selectedPetInfo.breed})
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Service Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                {t('appointmentForm.fields.service')}
                            </label>
                            <div className="flex gap-2">
                                {loadingServices ? (
                                    <div className="flex-1 px-4 py-4 border-2 border-gray-400 rounded-lg text-gray-600 bg-gray-50">
                                        {t('appointmentForm.loaders.services')}
                                    </div>
                                ) : services.length === 0 ? (
                                    <div className="flex-1 px-4 py-4 border-2 border-dashed border-gray-400 rounded-lg text-gray-600 bg-gray-50">
                                        {t('appointmentForm.placeholders.noServices')}
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={formData.service_id}
                                        onChange={(e) => handleServiceChange(e.target.value)}
                                        className="flex-1 px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-lg bg-white text-gray-900 font-medium"
                                    >
                                        <option value="">{t('appointmentForm.placeholders.selectService')}</option>
                                        {services.map((service) => (
                                            <option key={service.id} value={service.id}>
                                                {service.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowServiceModal(true)}
                                    className="px-4 py-4 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold rounded-lg shadow-lg transition duration-200 whitespace-nowrap"
                                    title={t('appointmentForm.tooltips.addService')}
                                >
                                    {t('appointmentForm.buttons.add')}
                                </button>
                            </div>
                        </div>

                        {/* Duration Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                {t('appointmentForm.fields.duration')}
                            </label>
                            <select
                                required
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-lg bg-white text-gray-900 font-medium"
                            >
                                <option value="30">{t('appointmentForm.durationOptions.minutes30')}</option>
                                <option value="60">{t('appointmentForm.durationOptions.hour')}</option>
                                <option value="90">{t('appointmentForm.durationOptions.hourThirty')}</option>
                            </select>
                        </div>

                        {/* Phone Display (read-only) */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                {t('appointmentForm.fields.phone')}
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                readOnly
                                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-lg bg-gray-50 text-gray-700 font-medium cursor-not-allowed"
                                placeholder={t('appointmentForm.placeholders.phone')}
                            />
                        </div>

                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                            {t('appointmentForm.fields.notes')}
                        </label>
                        <textarea
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows="3"
                            className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
                            placeholder={t('appointmentForm.placeholders.notes')}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full btn-brand shadow-brand-glow py-4 px-6 text-xl"
                    >
                        {isEditing ? t('appointmentForm.buttons.update') : t('appointmentForm.buttons.save')}
                    </button>
                </form>
            </div>

            {/* Customer Creation Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="modal-card bg-white rounded-lg shadow-xl p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                            {t('customerForm.title.new')}
                        </h3>
                        <form onSubmit={handleCreateCustomer} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        {t('customerForm.labels.name')}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={customerFormData.name}
                                        onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-base bg-white text-gray-900 font-medium"
                                        placeholder={t('customerForm.placeholders.name')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        {t('customerForm.labels.phone')}
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={customerFormData.phone}
                                        onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-base bg-white text-gray-900 font-medium"
                                        placeholder={t('customerForm.placeholders.phone')}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        {t('customerForm.labels.email')}
                                    </label>
                                    <input
                                        type="email"
                                        value={customerFormData.email}
                                        onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-base bg-white text-gray-900 font-medium"
                                        placeholder={t('customerForm.placeholders.email')}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        {t('customerForm.labels.address')}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={customerFormData.address}
                                        onChange={(e) => setCustomerFormData({ ...customerFormData, address: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-base bg-white text-gray-900 font-medium"
                                        placeholder={t('customerForm.placeholders.address')}
                                    />
                                    <p className="text-xs text-gray-600 mt-1">
                                        {t('customerForm.helpers.address')}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    {t('customerForm.labels.notes')}
                                </label>
                                <textarea
                                    value={customerFormData.notes || ''}
                                    onChange={(e) => setCustomerFormData({ ...customerFormData, notes: e.target.value })}
                                    rows="2"
                                    className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-base bg-white text-gray-900 font-medium"
                                    placeholder={t('customerForm.placeholders.notes')}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 btn-brand shadow-brand-glow py-3 px-6"
                                >
                                    {t('customerForm.buttons.save')}
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
                                    {t('customerForm.buttons.cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pet Creation Modal */}
            {showPetModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="modal-card bg-white rounded-lg shadow-xl p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                            {t('petForm.title.new')}
                        </h3>
                        <form onSubmit={handleCreatePet} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        {t('petForm.labels.name')}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={petFormData.name}
                                        onChange={(e) => setPetFormData({ ...petFormData, name: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-accent)] focus:border-[color:var(--brand-accent)] text-base bg-white text-gray-900 font-medium"
                                        placeholder={t('petForm.placeholders.name')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        {t('petForm.labels.breed')}
                                    </label>
                                    <input
                                        type="text"
                                        value={petFormData.breed}
                                        onChange={(e) => setPetFormData({ ...petFormData, breed: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-accent)] focus:border-[color:var(--brand-accent)] text-base bg-white text-gray-900 font-medium"
                                        placeholder={t('petForm.placeholders.breed')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        {t('petForm.labels.age')}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="30"
                                        value={petFormData.age}
                                        onChange={(e) => setPetFormData({ ...petFormData, age: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-accent)] focus:border-[color:var(--brand-accent)] text-base bg-white text-gray-900 font-medium"
                                        placeholder={t('petForm.placeholders.age')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        {t('petForm.labels.weight')}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="200"
                                        value={petFormData.weight}
                                        onChange={(e) => setPetFormData({ ...petFormData, weight: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-accent)] focus:border-[color:var(--brand-accent)] text-base bg-white text-gray-900 font-medium"
                                        placeholder={t('petForm.placeholders.weight')}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    {t('petForm.labels.medicalNotes')}
                                </label>
                                <textarea
                                    value={petFormData.medical_notes || ''}
                                    onChange={(e) => setPetFormData({ ...petFormData, medical_notes: e.target.value })}
                                    rows="2"
                                    className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-accent)] focus:border-[color:var(--brand-accent)] text-base bg-white text-gray-900 font-medium"
                                    placeholder={t('petForm.placeholders.medicalNotes')}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-brand-accent hover:bg-brand-accent-dark text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200"
                                >
                                    {t('petForm.buttons.save')}
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
                                    {t('petForm.buttons.cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showServiceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="modal-card bg-white rounded-lg shadow-xl p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                            {t('servicesForm.modalTitle')}
                        </h3>
                        <form onSubmit={handleCreateService} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        {t('servicesForm.labels.name')}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={serviceFormData.name}
                                        onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-base bg-white text-gray-900 font-medium"
                                        placeholder={t('servicesForm.placeholders.name')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        {t('servicesForm.labels.duration')}
                                    </label>
                                    <select
                                        value={serviceFormData.default_duration}
                                        onChange={(e) =>
                                            setServiceFormData({
                                                ...serviceFormData,
                                                default_duration: parseInt(e.target.value)
                                            })
                                        }
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-base bg-white text-gray-900 font-medium"
                                    >
                                        {[30, 45, 60, 75, 90, 120].map((value) => (
                                            <option key={value} value={value}>
                                                {t('servicesForm.durationOption', { minutes: value })}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        {t('servicesForm.labels.price')}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={serviceFormData.price}
                                        onChange={(e) => setServiceFormData({ ...serviceFormData, price: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-base bg-white text-gray-900 font-medium"
                                        placeholder={t('servicesForm.placeholders.price')}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    {t('servicesForm.labels.description')}
                                </label>
                                <textarea
                                    value={serviceFormData.description}
                                    onChange={(e) =>
                                        setServiceFormData({ ...serviceFormData, description: e.target.value })
                                    }
                                    rows="3"
                                    className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-base bg-white text-gray-900 font-medium"
                                    placeholder={t('servicesForm.placeholders.description')}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 btn-brand shadow-brand-glow py-3 px-6"
                                >
                                    {t('servicesForm.buttons.save')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowServiceModal(false)}
                                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200"
                                >
                                    {t('servicesForm.buttons.cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
