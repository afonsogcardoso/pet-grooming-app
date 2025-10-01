'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: '',
    pet_name: '',
    phone: '',
    service: '',
    appointment_date: '',
    appointment_time: '',
    notes: ''
  })

  // Load appointments
  useEffect(() => {
    loadAppointments()
  }, [])

  async function loadAppointments() {
    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })

    if (error) {
      console.error('Error loading appointments:', error)
    } else {
      setAppointments(data || [])
    }
    setLoading(false)
  }

  // Add appointment
  async function handleSubmit(e) {
    e.preventDefault()

    const { data, error } = await supabase
      .from('appointments')
      .insert([formData])
      .select()

    if (error) {
      alert('Error creating appointment: ' + error.message)
    } else {
      setAppointments([...appointments, ...data])
      setFormData({
        customer_name: '',
        pet_name: '',
        phone: '',
        service: '',
        appointment_date: '',
        appointment_time: '',
        notes: ''
      })
      setShowForm(false)
    }
  }

  // Delete appointment
  async function deleteAppointment(id) {
    if (!confirm('Delete this appointment?')) return

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error deleting appointment: ' + error.message)
    } else {
      setAppointments(appointments.filter(apt => apt.id !== id))
    }
  }

  // Mark as completed
  async function markCompleted(id) {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', id)

    if (error) {
      alert('Error updating appointment: ' + error.message)
    } else {
      loadAppointments()
    }
  }

  // Format date for display
  function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  // Format time for display
  function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-600">Loading appointments...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Appointments ({appointments.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-200 text-lg"
        >
          {showForm ? '✕ Cancel' : '+ New Appointment'}
        </button>
      </div>

      {/* Add Appointment Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">New Appointment</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pet Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.pet_name}
                  onChange={(e) => setFormData({ ...formData, pet_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                  placeholder="Max"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                  placeholder="+351 912 345 678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service *
                </label>
                <input
                  type="text"
                  required
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                  placeholder="Full Groom, Bath, Nail Trim..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time *
                </label>
                <input
                  type="time"
                  required
                  value={formData.appointment_time}
                  onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                placeholder="Any special requests or notes..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-200 text-lg"
            >
              Save Appointment
            </button>
          </form>
        </div>
      )}

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No appointments yet</h3>
          <p className="text-gray-500">Click "New Appointment" to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${apt.status === 'completed'
                  ? 'border-green-500 bg-green-50'
                  : 'border-indigo-500'
                }`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-800">
                      {apt.customer_name}
                    </h3>
                    {apt.status === 'completed' && (
                      <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        ✓ Completed
                      </span>
                    )}
                  </div>

                  <div className="text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">🐕 Pet:</span>
                      <span>{apt.pet_name}</span>
                    </div>
                    {apt.phone && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">📱 Phone:</span>
                        <span>{apt.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-medium">✂️ Service:</span>
                      <span>{apt.service}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">📅 Date:</span>
                      <span className="font-semibold text-indigo-600">
                        {formatDate(apt.appointment_date)} at {formatTime(apt.appointment_time)}
                      </span>
                    </div>
                    {apt.notes && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="font-medium">📝 Notes:</span>
                        <p className="text-gray-600 mt-1">{apt.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2">
                  {apt.status !== 'completed' && (
                    <button
                      onClick={() => markCompleted(apt.id)}
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 text-sm whitespace-nowrap"
                    >
                      ✓ Complete
                    </button>
                  )}
                  <button
                    onClick={() => deleteAppointment(apt.id)}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 text-sm whitespace-nowrap"
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}