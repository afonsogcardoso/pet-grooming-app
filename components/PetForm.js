// ============================================
// FILE: components/PetForm.js
// Add/edit pet form component
// ============================================

import { useState } from 'react'

export default function PetForm({ customerId, onSubmit, onCancel, initialData = null }) {
    const [formData, setFormData] = useState(
        initialData || {
            customer_id: customerId,
            name: '',
            breed: '',
            age: '',
            weight: '',
            medical_notes: ''
        }
    )

    const isEditing = !!initialData

    const handleSubmit = (e) => {
        e.preventDefault()
        // Convert age and weight to numbers if provided
        const submitData = {
            ...formData,
            age: formData.age ? parseInt(formData.age) : null,
            weight: formData.weight ? parseFloat(formData.weight) : null
        }
        onSubmit(submitData)
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-green-500">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
                {isEditing ? '✏️ Edit Pet' : '🐾 Add New Pet'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                            Pet Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
                            placeholder="Max"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Breed</label>
                        <input
                            type="text"
                            value={formData.breed}
                            onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                            className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
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
                            value={formData.age}
                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                            className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
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
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
                            placeholder="25.5"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                        Medical Notes
                    </label>
                    <textarea
                        value={formData.medical_notes}
                        onChange={(e) =>
                            setFormData({ ...formData, medical_notes: e.target.value })
                        }
                        rows="3"
                        className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
                        placeholder="Allergies, medications, special needs..."
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition duration-200 text-xl"
                    >
                        {isEditing ? '💾 Update Pet' : '💾 Save Pet'}
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
