// ============================================
// FILE: app/page.js
// Replace your existing app/page.js with this COMPLETE version
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState('list') // 'list' or 'calendar'
  const [filter, setFilter] = useState('all') // 'all', 'upcoming', 'completed'
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week, 1 = next week, -1 = previous week
  const [formData, setFormData] = useState({
    customer_name: '',
    pet_name: '',
    phone: '',
    service: '',
    appointment_date: '',
    appointment_time: '',
    notes: ''
  })

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

  // Load appointments
  useEffect(() => {
    loadAppointments()
  }, [])

  // Filter appointments whenever they change or filter changes
  useEffect(() => {
    filterAppointments()
  }, [appointments, filter])

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

  function filterAppointments() {
    let filtered = [...appointments]
    const today = new Date().toISOString().split('T')[0]

    if (filter === 'upcoming') {
      filtered = filtered.filter(apt =>
        apt.status !== 'completed' && apt.appointment_date >= today
      )
    } else if (filter === 'completed') {
      filtered = filtered.filter(apt => apt.status === 'completed')
    } else if (filter === 'past') {
      filtered = filtered.filter(apt =>
        apt.status !== 'completed' && apt.appointment_date < today
      )
    }

    setFilteredAppointments(filtered)
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

  // Get week dates for calendar view
  function getWeekDates() {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))

    // Apply week offset
    monday.setDate(monday.getDate() + (weekOffset * 7))

    const week = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      week.push(date)
    }
    return week
  }

  // Navigate weeks
  function goToPreviousWeek() {
    setWeekOffset(weekOffset - 1)
  }

  function goToNextWeek() {
    setWeekOffset(weekOffset + 1)
  }

  function goToThisWeek() {
    setWeekOffset(0)
  }

  // Get week range text
  function getWeekRangeText() {
    const week = getWeekDates()
    const start = week[0]
    const end = week[6]
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startStr} - ${endStr}`
  }

  // Get appointments for a specific date
  function getAppointmentsForDate(date) {
    const dateStr = date.toISOString().split('T')[0]
    return filteredAppointments.filter(apt => apt.appointment_date === dateStr)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-600">Loading appointments...</div>
      </div>
    )
  }

  const weekDates = getWeekDates()

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Appointments ({filteredAppointments.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition duration-200 text-lg"
        >
          {showForm ? '✕ Cancel' : '+ New Appointment'}
        </button>
      </div>

      {/* View Toggle & Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setView('list')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition duration-200 ${view === 'list'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            📋 List View
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition duration-200 ${view === 'calendar'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            📅 Week View
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`py-3 px-4 rounded-lg font-semibold transition duration-200 ${filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`py-3 px-4 rounded-lg font-semibold transition duration-200 ${filter === 'upcoming'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`py-3 px-4 rounded-lg font-semibold transition duration-200 ${filter === 'completed'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`py-3 px-4 rounded-lg font-semibold transition duration-200 ${filter === 'past'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Past Due
          </button>
        </div>
      </div>

      {/* Add Appointment Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-indigo-500">
          <h3 className="text-xl font-bold text-gray-800 mb-4">New Appointment</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Pet Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.pet_name}
                  onChange={(e) => setFormData({ ...formData, pet_name: e.target.value })}
                  className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 placeholder-gray-500 font-medium"
                  placeholder="Max"
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
                  {services.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  required
                  value={formData.appointment_time}
                  onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                  className="w-full px-4 py-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg bg-white text-gray-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Notes
              </label>
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
              💾 Save Appointment
            </button>
          </form>
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="bg-white rounded-lg shadow-md p-4">
          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <button
              onClick={goToPreviousWeek}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              ← Previous
            </button>

            <div className="text-center flex-1">
              <div className="font-bold text-gray-800 text-lg">
                {getWeekRangeText()}
              </div>
              {weekOffset !== 0 && (
                <button
                  onClick={goToThisWeek}
                  className="text-sm text-indigo-600 hover:underline mt-1"
                >
                  Back to This Week
                </button>
              )}
            </div>

            <button
              onClick={goToNextWeek}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              Next →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDates.map((date, i) => (
                  <div key={i} className="text-center">
                    <div className="font-bold text-gray-700">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-sm ${date.toDateString() === new Date().toDateString()
                        ? 'bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto font-bold'
                        : 'text-gray-600'
                      }`}>
                      {date.getDate()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {weekDates.map((date, i) => {
                  const dayAppointments = getAppointmentsForDate(date)
                  return (
                    <div key={i} className="border-2 border-gray-200 rounded-lg p-2 min-h-[200px] bg-gray-50">
                      {dayAppointments.length === 0 ? (
                        <div className="text-center text-gray-400 text-sm mt-8">No appointments</div>
                      ) : (
                        <div className="space-y-2">
                          {dayAppointments.map(apt => (
                            <div
                              key={apt.id}
                              className={`p-2 rounded text-xs cursor-pointer hover:shadow-md transition ${apt.status === 'completed'
                                  ? 'bg-green-100 border-l-4 border-green-500'
                                  : 'bg-indigo-100 border-l-4 border-indigo-500'
                                }`}
                              onClick={() => {
                                if (confirm(`${apt.customer_name} - ${apt.pet_name}\n${formatTime(apt.appointment_time)}\n${apt.service}\n\nMark as completed?`)) {
                                  markCompleted(apt.id)
                                }
                              }}
                            >
                              <div className="font-bold text-gray-800">{formatTime(apt.appointment_time)}</div>
                              <div className="text-gray-700">{apt.customer_name}</div>
                              <div className="text-gray-600">{apt.pet_name}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <>
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {filter === 'all' ? 'No appointments yet' : `No ${filter} appointments`}
              </h3>
              <p className="text-gray-500">
                {filter === 'all'
                  ? 'Click "New Appointment" to get started!'
                  : 'Try changing the filter above'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((apt) => (
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

                      <div className="text-gray-700 space-y-1 text-base">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">🐕 Pet:</span>
                          <span className="font-medium">{apt.pet_name}</span>
                        </div>
                        {apt.phone && (
                          <div className="flex items-center gap-2">
                            <span className="font-bold">📱 Phone:</span>
                            <a href={`tel:${apt.phone}`} className="font-medium text-indigo-600 hover:underline">
                              {apt.phone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-bold">✂️ Service:</span>
                          <span className="font-medium">{apt.service}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">📅 Date:</span>
                          <span className="font-bold text-indigo-600">
                            {formatDate(apt.appointment_date)} at {formatTime(apt.appointment_time)}
                          </span>
                        </div>
                        {apt.notes && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <span className="font-bold">📝 Notes:</span>
                            <p className="text-gray-700 mt-1 font-medium">{apt.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2">
                      {apt.status !== 'completed' && (
                        <button
                          onClick={() => markCompleted(apt.id)}
                          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-5 rounded-lg transition duration-200 text-sm whitespace-nowrap shadow-md"
                        >
                          ✓ Complete
                        </button>
                      )}
                      <button
                        onClick={() => deleteAppointment(apt.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-5 rounded-lg transition duration-200 text-sm whitespace-nowrap shadow-md"
                      >
                        🗑 Delete
                      </button>
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