'use client'

// ============================================
// FILE: components/PetForm.js
// Add/edit pet form component
// ============================================

import { useState } from 'react'
import { useTranslation } from '@/components/TranslationProvider'

export default function PetForm({ customerId, onSubmit, onCancel, initialData = null }) {
  const { t } = useTranslation()
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
    const submitData = {
      ...formData,
      age: formData.age ? parseInt(formData.age, 10) : null,
      weight: formData.weight ? parseFloat(formData.weight) : null
    }
    onSubmit(submitData)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-green-500">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        {isEditing ? t('petForm.title.edit') : t('petForm.title.new')}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              {t('petForm.labels.name')}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
              placeholder={t('petForm.placeholders.name')}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              {t('petForm.labels.breed')}
            </label>
            <input
              type="text"
              value={formData.breed ?? ''}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
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
              value={formData.age ?? ''}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
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
              value={formData.weight ?? ''}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
              placeholder={t('petForm.placeholders.weight')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">
            {t('petForm.labels.medicalNotes')}
          </label>
          <textarea
            value={formData.medical_notes ?? ''}
            onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
            rows="3"
            className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
            placeholder={t('petForm.placeholders.medicalNotes')}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition duration-200 text-xl"
          >
            {isEditing ? t('petForm.buttons.update') : t('petForm.buttons.save')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition duration-200 text-xl"
          >
            {t('petForm.buttons.cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
