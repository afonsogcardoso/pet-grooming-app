// ============================================
// FILE: components/CustomerManager.js
// Customer list with search, add, edit, delete, and pet management
// ============================================

import { useState, useEffect } from 'react'
import {
    loadCustomerSummary,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
    loadCustomerAppointments
} from '@/lib/customerService'
import { formatDate, formatTime } from '@/utils/dateUtils'
import CustomerForm from './CustomerForm'
import PetManager from './PetManager'

export default function CustomerManager() {
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState(null)
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [customerHistory, setCustomerHistory] = useState([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    useEffect(() => {
        fetchCustomers()
    }, [])

    async function fetchCustomers() {
        setLoading(true)
        const { data, error } = await loadCustomerSummary()

        if (error) {
            console.error('Error loading customers:', error)
            alert('Error loading customers: ' + error.message)
        } else {
            setCustomers(data)
        }
        setLoading(false)
    }

    async function handleSearch() {
        if (!searchTerm.trim()) {
            fetchCustomers()
            return
        }

        setLoading(true)
        const { data, error } = await searchCustomers(searchTerm)

        if (error) {
            console.error('Error searching customers:', error)
            alert('Error searching customers: ' + error.message)
        } else {
            setCustomers(data)
        }
        setLoading(false)
    }

    async function handleCreateCustomer(formData) {
        const { data, error } = await createCustomer(formData)

        if (error) {
            alert('Error creating customer: ' + error.message)
        } else {
            fetchCustomers()
            setShowForm(false)
        }
    }

    async function handleUpdateCustomer(formData) {
        const { data, error } = await updateCustomer(editingCustomer.id, formData)

        if (error) {
            alert('Error updating customer: ' + error.message)
        } else {
            fetchCustomers()
            setEditingCustomer(null)
            setShowForm(false)
        }
    }

    async function handleDeleteCustomer(id, name) {
        if (!confirm(`Delete ${name} and all their pets/appointments? This cannot be undone.`))
            return

        const { error } = await deleteCustomer(id)

        if (error) {
            alert('Error deleting customer: ' + error.message)
        } else {
            fetchCustomers()
            if (selectedCustomer?.id === id) {
                setSelectedCustomer(null)
            }
        }
    }

    function handleEditCustomer(customer) {
        setEditingCustomer(customer)
        setShowForm(true)
        setSelectedCustomer(null)
    }

    function handleCancelForm() {
        setEditingCustomer(null)
        setShowForm(false)
    }

    async function handleViewCustomer(customer) {
        setSelectedCustomer(customer)
        setShowForm(false)
        setEditingCustomer(null)

        // Load customer's appointment history
        setLoadingHistory(true)
        const { data, error } = await loadCustomerAppointments(customer.id)

        if (error) {
            console.error('Error loading customer history:', error)
        } else {
            setCustomerHistory(data || [])
        }
        setLoadingHistory(false)
    }

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="text-xl text-gray-600">Loading customers...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">
                    👥 Customers ({customers.length})
                </h2>
                <button
                    onClick={() => {
                        if (showForm) {
                            handleCancelForm()
                        } else {
                            setShowForm(true)
                            setSelectedCustomer(null)
                        }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition duration-200 text-lg"
                >
                    {showForm ? '✕ Cancel' : '+ New Customer'}
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search by name or phone..."
                        className="flex-1 px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 font-medium"
                    />
                    <button
                        onClick={handleSearch}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow transition duration-200"
                    >
                        🔍 Search
                    </button>
                    {searchTerm && (
                        <button
                            onClick={() => {
                                setSearchTerm('')
                                fetchCustomers()
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow transition duration-200"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Customer Form */}
            {showForm && (
                <CustomerForm
                    onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
                    onCancel={handleCancelForm}
                    initialData={editingCustomer}
                />
            )}

            {/* Selected Customer Detail View */}
            {selectedCustomer && (
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">
                                    {selectedCustomer.name}
                                </h3>
                                <p className="text-gray-600">
                                    📱 {selectedCustomer.phone}
                                    {selectedCustomer.email && ` • ✉️ ${selectedCustomer.email}`}
                                </p>
                                {selectedCustomer.address && (
                                    <p className="text-gray-600">📍 {selectedCustomer.address}</p>
                                )}
                            </div>
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                            >
                                ✕ Close
                            </button>
                        </div>

                        {selectedCustomer.notes && (
                            <div className="mb-4 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                                <p className="font-bold text-sm text-gray-700">Notes:</p>
                                <p className="text-gray-700">{selectedCustomer.notes}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-blue-50 p-3 rounded">
                                <p className="text-sm font-bold text-blue-900">Pets</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {selectedCustomer.pet_count || 0}
                                </p>
                            </div>
                            <div className="bg-purple-50 p-3 rounded">
                                <p className="text-sm font-bold text-purple-900">Appointments</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {selectedCustomer.appointment_count || 0}
                                </p>
                            </div>
                            <div className="bg-green-50 p-3 rounded">
                                <p className="text-sm font-bold text-green-900">Last Visit</p>
                                <p className="text-sm font-bold text-green-600">
                                    {selectedCustomer.last_appointment_date
                                        ? formatDate(selectedCustomer.last_appointment_date)
                                        : 'Never'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pet Manager */}
                    <PetManager
                        customerId={selectedCustomer.id}
                        customerName={selectedCustomer.name}
                    />

                    {/* Appointment History */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            📅 Appointment History
                        </h3>
                        {loadingHistory ? (
                            <p className="text-center text-gray-600">Loading...</p>
                        ) : customerHistory.length === 0 ? (
                            <p className="text-center text-gray-600">No appointments yet</p>
                        ) : (
                            <div className="space-y-2">
                                {customerHistory.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="p-3 bg-gray-50 rounded border-l-4 border-indigo-500"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-gray-800">
                                                    {apt.pets?.name || apt.pet_name} - {apt.service}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {formatDate(apt.appointment_date)} at{' '}
                                                    {formatTime(apt.appointment_time)}
                                                </p>
                                            </div>
                                            {apt.status === 'completed' && (
                                                <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                                                    ✓
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Customer List */}
            {!selectedCustomer && !showForm && (
                <>
                    {customers.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
                            <div className="text-6xl mb-4">👥</div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                No customers yet
                            </h3>
                            <p className="text-gray-500">Click "New Customer" to get started!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {customers.map((customer) => (
                                <div
                                    key={customer.id}
                                    className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500 hover:shadow-lg transition cursor-pointer"
                                    onClick={() => handleViewCustomer(customer)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-lg font-bold text-gray-800">
                                            {customer.name}
                                        </h4>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEditCustomer(customer)
                                                }}
                                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded text-xs transition duration-200"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteCustomer(customer.id, customer.name)
                                                }}
                                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-xs transition duration-200"
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-700 space-y-1">
                                        <div>📱 {customer.phone}</div>
                                        {customer.email && <div>✉️ {customer.email}</div>}
                                        <div className="flex gap-4 mt-2 text-xs">
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">
                                                🐾 {customer.pet_count || 0} pets
                                            </span>
                                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-semibold">
                                                📅 {customer.appointment_count || 0} appts
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
