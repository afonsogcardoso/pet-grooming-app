// ============================================
// FILE: components/PetManager.js
// Pet list and management for a customer
// ============================================

import { useState, useEffect } from 'react'
import { loadPetsByCustomer, createPet, updatePet, deletePet } from '@/lib/customerService'
import PetForm from './PetForm'

export default function PetManager({ customerId, customerName }) {
    const [pets, setPets] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingPet, setEditingPet] = useState(null)

    useEffect(() => {
        if (customerId) {
            fetchPets()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerId])

    async function fetchPets() {
        setLoading(true)
        const { data, error } = await loadPetsByCustomer(customerId)

        if (error) {
            console.error('Error loading pets:', error)
            alert('Error loading pets: ' + error.message)
        } else {
            setPets(data)
        }
        setLoading(false)
    }

    async function handleCreatePet(formData) {
        const { data, error } = await createPet(formData)

        if (error) {
            alert('Error creating pet: ' + error.message)
        } else {
            setPets([...pets, ...data])
            setShowForm(false)
        }
    }

    async function handleUpdatePet(formData) {
        const { data, error } = await updatePet(editingPet.id, formData)

        if (error) {
            alert('Error updating pet: ' + error.message)
        } else {
            setPets(pets.map((pet) => (pet.id === editingPet.id ? data[0] : pet)))
            setEditingPet(null)
            setShowForm(false)
        }
    }

    async function handleDeletePet(id, petName) {
        if (!confirm(`Delete ${petName}? This action cannot be undone.`)) return

        const { error } = await deletePet(id)

        if (error) {
            alert('Error deleting pet: ' + error.message)
        } else {
            setPets(pets.filter((pet) => pet.id !== id))
        }
    }

    function handleEditPet(pet) {
        setEditingPet(pet)
        setShowForm(true)
    }

    function handleCancelForm() {
        setEditingPet(null)
        setShowForm(false)
    }

    if (loading) {
        return <div className="text-center py-4 text-gray-600">Loading pets...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">
                    🐾 Pets for {customerName}
                </h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-200"
                >
                    {showForm ? '✕ Cancel' : '+ Add Pet'}
                </button>
            </div>

            {showForm && (
                <PetForm
                    customerId={customerId}
                    onSubmit={editingPet ? handleUpdatePet : handleCreatePet}
                    onCancel={handleCancelForm}
                    initialData={editingPet}
                />
            )}

            {pets.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
                    <div className="text-4xl mb-2">🐕</div>
                    <p className="text-gray-600">No pets yet. Add one above!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pets.map((pet) => (
                        <div
                            key={pet.id}
                            className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-lg font-bold text-gray-800">{pet.name}</h4>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditPet(pet)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-sm transition duration-200"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDeletePet(pet.id, pet.name)}
                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm transition duration-200"
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>

                            <div className="text-sm text-gray-700 space-y-1">
                                {pet.breed && (
                                    <div>
                                        <span className="font-bold">Breed:</span> {pet.breed}
                                    </div>
                                )}
                                {pet.age && (
                                    <div>
                                        <span className="font-bold">Age:</span> {pet.age} years
                                    </div>
                                )}
                                {pet.weight && (
                                    <div>
                                        <span className="font-bold">Weight:</span> {pet.weight} kg
                                    </div>
                                )}
                                {pet.medical_notes && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                        <span className="font-bold">Medical Notes:</span>
                                        <p className="text-gray-600 mt-1">{pet.medical_notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
