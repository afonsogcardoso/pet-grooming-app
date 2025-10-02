// ============================================
// FILE: components/CustomerForm.js
// Add/edit customer form component
// ============================================

import { useState } from 'react'

export default function CustomerForm({ onSubmit, onCancel, initialData = null }) {
    const [formData, setFormData] = useState(
        initialData || {
            name: '',
            phone: '',
            email: '',
            address: '',
            notes: ''
        }
    )

    const isEditing = !!initialData

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-indigo-500">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
                {isEditing ? 'Edit Customer' : 'New Customer'}
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
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
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
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
                            placeholder="+351 912 345 678"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-800 mb-2">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
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
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
                            placeholder="Full address or Google Maps link"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                            📍 Enter full address or paste Google Maps link - used for mobile grooming service location
                        </p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">Notes</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
                        placeholder="Any special notes about this customer..."
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition duration-200 text-xl"
                    >
                        {isEditing ? '💾 Update Customer' : '💾 Save Customer'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition duration-200 text-xl"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}
