// ============================================
// FILE: components/AppointmentForm.js
// ============================================
'use client'

import Image from 'next/image'
import { useState, useEffect, useRef, useMemo } from 'react'
import {
    loadCustomers,
    loadPetsByCustomer,
    loadCustomerPetSearchIndex,
    createCustomer,
    createPet
} from '@/lib/customerService'
import { loadServices } from '@/lib/serviceService'
import { useTranslation } from '@/components/TranslationProvider'
import BreedSelect from '@/components/BreedSelect'

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

export default function AppointmentForm({
    onSubmit,
    onCancel,
    initialData = null,
    onDelete,
    onMarkCompleted
}) {
    const { t } = useTranslation()
    const [customers, setCustomers] = useState([])
    const [pets, setPets] = useState([])
    const [loadingCustomers, setLoadingCustomers] = useState(true)
    const [loadingPets, setLoadingPets] = useState(false)
    const [services, setServices] = useState([])
    const [loadingServices, setLoadingServices] = useState(true)
    const [showCustomerModal, setShowCustomerModal] = useState(false)
    const [showPetModal, setShowPetModal] = useState(false)

    const [formData, setFormData] = useState(() => buildInitialFormState(initialData))

    const [customerFormData, setCustomerFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
    })
    const [petFormData, setPetFormData] = useState({
        name: '',
        breed: '',
        age: '',
        weight: '',
        medical_notes: ''
    })
    const [customerPetIndex, setCustomerPetIndex] = useState([])
    const [loadingCustomerPetIndex, setLoadingCustomerPetIndex] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [selectedPetInfo, setSelectedPetInfo] = useState(initialData?.pets || null)
    const [beforePhotoPreview, setBeforePhotoPreview] = useState(initialData?.before_photo_url || '')
    const [afterPhotoPreview, setAfterPhotoPreview] = useState(initialData?.after_photo_url || '')
    const [beforePhotoFile, setBeforePhotoFile] = useState(null)
    const [afterPhotoFile, setAfterPhotoFile] = useState(null)
    const [removeBeforePhoto, setRemoveBeforePhoto] = useState(false)
    const [removeAfterPhoto, setRemoveAfterPhoto] = useState(false)
    const beforePreviewRef = useRef(null)
    const afterPreviewRef = useRef(null)
    const searchDropdownTimeoutRef = useRef(null)

    const isEditing = Boolean(initialData?.id)
    const isCompleted = Boolean(initialData?.status === 'completed')

    const searchResults = useMemo(() => {
        const term = searchTerm.trim().toLowerCase()
        if (!term) {
            return []
        }

        return customerPetIndex
            .filter((entry) => {
                return (
                    entry.pet_name?.toLowerCase().includes(term) ||
                    entry.customer_name?.toLowerCase().includes(term)
                )
            })
            .slice(0, 8)
    }, [customerPetIndex, searchTerm])

    const formatSearchLabel = (petName, customerName) => {
        if (petName && customerName) {
            return `${petName} · ${customerName}`
        }
        return customerName || petName || ''
    }

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
        fetchCustomerPetIndex()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Update form data when initialData changes (e.g., when editing a different appointment)
    useEffect(() => {
        if (initialData) {
            setFormData(buildInitialFormState(initialData))
            setSelectedPetInfo(initialData.pets || null)
            setBeforePhotoPreview(initialData.before_photo_url || '')
            setAfterPhotoPreview(initialData.after_photo_url || '')
            setBeforePhotoFile(null)
            setAfterPhotoFile(null)
            setRemoveBeforePhoto(false)
            setRemoveAfterPhoto(false)
        } else {
            setFormData(buildInitialFormState(null))
            setSelectedPetInfo(null)
            setBeforePhotoPreview('')
            setAfterPhotoPreview('')
            setBeforePhotoFile(null)
            setAfterPhotoFile(null)
            setRemoveBeforePhoto(false)
            setRemoveAfterPhoto(false)
        }
        if (initialData?.pets?.name && initialData?.customers?.name) {
            setSearchTerm(formatSearchLabel(initialData.pets.name, initialData.customers.name))
        } else if (!initialData) {
            setSearchTerm('')
        }
    }, [initialData])

    useEffect(() => {
        return () => {
            if (beforePreviewRef.current) {
                URL.revokeObjectURL(beforePreviewRef.current)
            }
            if (afterPreviewRef.current) {
                URL.revokeObjectURL(afterPreviewRef.current)
            }
            if (searchDropdownTimeoutRef.current) {
                clearTimeout(searchDropdownTimeoutRef.current)
            }
        }
    }, [])

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

    async function fetchCustomerPetIndex() {
        setLoadingCustomerPetIndex(true)
        const { data, error } = await loadCustomerPetSearchIndex()

        if (error) {
            console.error('Error loading customer/pet index:', error)
            setCustomerPetIndex([])
        } else {
            setCustomerPetIndex(data)
        }
        setLoadingCustomerPetIndex(false)
    }

    function handleSearchInputChange(value) {
        setSearchTerm(value)
        setIsSearchOpen(true)
    }

    function handleSearchFocus() {
        if (searchDropdownTimeoutRef.current) {
            clearTimeout(searchDropdownTimeoutRef.current)
            searchDropdownTimeoutRef.current = null
        }
        setIsSearchOpen(true)
    }

    function handleSearchBlur() {
        searchDropdownTimeoutRef.current = setTimeout(() => {
            setIsSearchOpen(false)
        }, 150)
    }

    function handleSearchSelect(entry) {
        setSearchTerm(formatSearchLabel(entry.pet_name, entry.customer_name))
        handleCustomerChange(
            entry.customer_id,
            {
                id: entry.customer_id,
                phone: entry.customer_phone
            },
            { skipSearchUpdate: true }
        )
        handlePetChange(entry.pet_id)
        if (searchDropdownTimeoutRef.current) {
            clearTimeout(searchDropdownTimeoutRef.current)
            searchDropdownTimeoutRef.current = null
        }
        setIsSearchOpen(false)
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

    function handleCustomerChange(customerId, customerOverride = null, { skipSearchUpdate = false } = {}) {
        const customer = customerOverride || customers.find((c) => c.id === customerId)
        setFormData((prev) => ({
            ...prev,
            customer_id: customerId,
            phone: customer?.phone || '',
            pet_id: '' // Reset pet selection
        }))

        if (!skipSearchUpdate && customer?.name && !formData.pet_id) {
            setSearchTerm(customer.name)
        }
    }

    function handlePetChange(petId) {
        setFormData((prev) => ({
            ...prev,
            pet_id: petId
        }))

        if (!petId) {
            return
        }

        const matchingEntry = customerPetIndex.find((entry) => entry.pet_id === petId)
        if (matchingEntry) {
            setSearchTerm(formatSearchLabel(matchingEntry.pet_name, matchingEntry.customer_name))
        }
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
        const payload = {
            name: customerFormData.name,
            phone: customerFormData.phone,
            email: customerFormData.email,
            address: customerFormData.address,
            notes: customerFormData.notes
        }

        const { data, error } = await createCustomer(payload)

        if (error) {
            alert(t('customerForm.errors.create', { message: error.message }))
        } else {
            const newCustomer = data[0]
            setCustomers((prev) => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)))
            handleCustomerChange(newCustomer.id, newCustomer)
            setSearchTerm(newCustomer.name)
            setCustomerFormData({
                name: '',
                phone: '',
                email: '',
                address: '',
                notes: ''
            })
            setShowCustomerModal(false)
            setShowPetModal(true)
        }
    }

    async function handleCreatePet(e) {
        e.preventDefault()
        if (!formData.customer_id) {
            alert(t('appointmentForm.messages.selectCustomerFirst'))
            return
        }
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
            const newPet = data[0]
            setPets((prev) => [...prev, newPet].sort((a, b) => a.name.localeCompare(b.name)))
            handlePetChange(newPet.id)
            const customer = customers.find((c) => c.id === formData.customer_id)
            setSearchTerm(formatSearchLabel(newPet.name, customer?.name || ''))
            setPetFormData({
                name: '',
                breed: '',
                age: '',
                weight: '',
                medical_notes: ''
            })
            setShowPetModal(false)
            fetchCustomerPetIndex()
        }
    }

    const handleBeforePhotoChange = (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        if (beforePreviewRef.current) {
            URL.revokeObjectURL(beforePreviewRef.current)
        }
        const blobUrl = URL.createObjectURL(file)
        beforePreviewRef.current = blobUrl
        setBeforePhotoFile(file)
        setBeforePhotoPreview(blobUrl)
        setRemoveBeforePhoto(false)
    }

    const handleAfterPhotoChange = (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        if (afterPreviewRef.current) {
            URL.revokeObjectURL(afterPreviewRef.current)
        }
        const blobUrl = URL.createObjectURL(file)
        afterPreviewRef.current = blobUrl
        setAfterPhotoFile(file)
        setAfterPhotoPreview(blobUrl)
        setRemoveAfterPhoto(false)
    }

    const handleRemoveBeforePhoto = () => {
        if (beforePreviewRef.current) {
            URL.revokeObjectURL(beforePreviewRef.current)
            beforePreviewRef.current = null
        }
        setBeforePhotoFile(null)
        setBeforePhotoPreview('')
        setRemoveBeforePhoto(true)
    }

    const handleRemoveAfterPhoto = () => {
        if (afterPreviewRef.current) {
            URL.revokeObjectURL(afterPreviewRef.current)
            afterPreviewRef.current = null
        }
        setAfterPhotoFile(null)
        setAfterPhotoPreview('')
        setRemoveAfterPhoto(true)
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

        onSubmit(payload, {
            beforePhotoFile,
            afterPhotoFile,
            removeBeforePhoto,
            removeAfterPhoto,
            currentBeforePhotoUrl: initialData?.before_photo_url || null,
            currentAfterPhotoUrl: initialData?.after_photo_url || null
        })
    }

    return (
        <>
            <div className="modal-card bg-white rounded-lg p-5 sm:p-6">
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
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                            {t('appointmentForm.fields.search')}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                disabled={loadingCustomerPetIndex}
                                onFocus={(e) => {
                                    e.target.select()
                                    handleSearchFocus()
                                }}
                                onBlur={handleSearchBlur}
                                onChange={(e) => handleSearchInputChange(e.target.value)}
                                placeholder={
                                    loadingCustomerPetIndex
                                        ? t('appointmentForm.search.loading')
                                        : t('appointmentForm.placeholders.search')
                                }
                                className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-lg bg-white text-gray-900 font-medium disabled:bg-gray-100"
                            />
                            {isSearchOpen && searchTerm.trim().length > 0 && (
                                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto z-20">
                                    {loadingCustomerPetIndex ? (
                                        <div className="px-4 py-3 text-sm text-gray-500">
                                            {t('appointmentForm.search.loading')}
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        searchResults.map((entry) => (
                                            <button
                                                type="button"
                                                key={`${entry.customer_id}-${entry.pet_id}`}
                                                onMouseDown={(event) => {
                                                    event.preventDefault()
                                                    handleSearchSelect(entry)
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-brand-primary-soft focus:bg-brand-primary-soft transition"
                                            >
                                                <div className="text-base font-semibold text-gray-900">
                                                    {entry.pet_name}
                                                    {entry.pet_breed && (
                                                        <span className="text-sm text-gray-500">{` · ${entry.pet_breed}`}</span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {entry.customer_name} • {entry.customer_phone || t('appointmentForm.search.noPhone')}
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-gray-500">
                                            {t('appointmentForm.search.noResults')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {t('appointmentForm.search.instructions')}
                        </p>
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
                                <Image
                                    src={selectedPetInfo.photo_url}
                                    alt={selectedPetInfo.name || 'Pet'}
                                    width={80}
                                    height={80}
                                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow"
                                    unoptimized
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

                        {/* Before & After Photos */}
                        <div className="md:col-span-2 space-y-4">
                            <p className="text-sm font-bold text-gray-800">
                                {t('appointmentForm.sections.beforeAfter')}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 border-2 border-gray-200 rounded-xl">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">
                                        {t('appointmentForm.labels.beforePhoto')}
                                    </p>
                                    {beforePhotoPreview ? (
                                        <div className="flex items-center gap-3 mb-3">
                                            <Image
                                                src={beforePhotoPreview}
                                                alt="Before"
                                                width={96}
                                                height={96}
                                                className="w-24 h-24 rounded-xl object-cover border-2 border-brand-primary"
                                                unoptimized
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveBeforePhoto}
                                                className="text-sm font-semibold text-red-600 hover:text-red-700"
                                            >
                                                {t('appointmentForm.buttons.removePhoto')}
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 mb-3">
                                            {t('appointmentForm.helpers.beforePhoto')}
                                        </p>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBeforePhotoChange}
                                        className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[color:var(--brand-primary-soft)] file:text-[color:var(--brand-primary)] hover:file:bg-[color:var(--brand-primary)] hover:file:text-white"
                                    />
                                </div>
                                <div className="p-4 border-2 border-gray-200 rounded-xl">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">
                                        {t('appointmentForm.labels.afterPhoto')}
                                    </p>
                                    {afterPhotoPreview ? (
                                        <div className="flex items-center gap-3 mb-3">
                                            <Image
                                                src={afterPhotoPreview}
                                                alt="After"
                                                width={96}
                                                height={96}
                                                className="w-24 h-24 rounded-xl object-cover border-2 border-brand-accent"
                                                unoptimized
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveAfterPhoto}
                                                className="text-sm font-semibold text-red-600 hover:text-red-700"
                                            >
                                                {t('appointmentForm.buttons.removePhoto')}
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 mb-3">
                                            {t('appointmentForm.helpers.afterPhoto')}
                                        </p>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAfterPhotoChange}
                                        className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[color:var(--brand-accent-soft)] file:text-[color:var(--brand-accent)] hover:file:bg-[color:var(--brand-accent)] hover:file:text-white"
                                    />
                                </div>
                            </div>
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

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                        <button
                            type="submit"
                            className="w-full sm:flex-[0.6] btn-brand shadow-brand-glow py-4 px-6 text-xl"
                        >
                            {isEditing ? t('appointmentForm.buttons.update') : t('appointmentForm.buttons.save')}
                        </button>
                        {isEditing && (
                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isCompleted) {
                                            onMarkCompleted?.()
                                        }
                                    }}
                                    disabled={isCompleted || !onMarkCompleted}
                                    className={`w-full rounded-2xl border px-4 py-3 text-base font-semibold transition disabled:cursor-not-allowed ${
                                        isCompleted
                                            ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    }`}
                                >
                                    {isCompleted
                                        ? t('appointmentForm.buttons.completed')
                                        : t('appointmentForm.buttons.markCompleted')}
                                </button>
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    disabled={!onDelete}
                                    className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {t('appointmentForm.buttons.delete')}
                                </button>
                            </div>
                        )}
                    </div>
                </form>
            </div>
            {showCustomerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="modal-card bg-white rounded-lg p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                                        onChange={(e) =>
                                            setCustomerFormData({ ...customerFormData, name: e.target.value })
                                        }
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
                                        onChange={(e) =>
                                            setCustomerFormData({ ...customerFormData, phone: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-base bg-white text-gray-900 font-medium"
                                        placeholder={t('customerForm.placeholders.phone')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        {t('customerForm.labels.email')}
                                    </label>
                                    <input
                                        type="email"
                                        value={customerFormData.email}
                                        onChange={(e) =>
                                            setCustomerFormData({ ...customerFormData, email: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-base bg-white text-gray-900 font-medium"
                                        placeholder={t('customerForm.placeholders.email')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        {t('customerForm.labels.address')}
                                    </label>
                                    <input
                                        type="text"
                                        value={customerFormData.address}
                                        onChange={(e) =>
                                            setCustomerFormData({ ...customerFormData, address: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-base bg-white text-gray-900 font-medium"
                                        placeholder={t('customerForm.placeholders.address')}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        {t('customerForm.labels.notes')}
                                    </label>
                                    <textarea
                                        value={customerFormData.notes}
                                        onChange={(e) =>
                                            setCustomerFormData({ ...customerFormData, notes: e.target.value })
                                        }
                                        rows="3"
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-primary)] focus:border-[color:var(--brand-primary)] text-base bg-white text-gray-900 font-medium"
                                        placeholder={t('customerForm.placeholders.notes')}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 btn-brand shadow-brand-glow py-3 px-6">
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

            {showPetModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="modal-card bg-white rounded-lg p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                                    <BreedSelect
                                        value={petFormData.breed}
                                        onChange={(breed) => setPetFormData({ ...petFormData, breed })}
                                        placeholder={t('petForm.placeholders.breed')}
                                        className="text-base py-3"
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
                                    value={petFormData.medical_notes}
                                    onChange={(e) => setPetFormData({ ...petFormData, medical_notes: e.target.value })}
                                    rows="3"
                                    className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-[color:var(--brand-accent)] focus:border-[color:var(--brand-accent)] text-base bg-white text-gray-900 font-medium"
                                    placeholder={t('petForm.placeholders.medicalNotes')}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 btn-brand shadow-brand-glow py-3 px-6">
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
        </>
    )
}
