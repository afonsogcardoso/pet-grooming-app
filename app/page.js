// ============================================
// FILE: app/page.js
// Main page - Refactored with modular components
// ============================================
'use client'

import { useState, useEffect } from 'react'
import {
  loadAppointments,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment as deleteAppointmentService,
  filterAppointments
} from '@/lib/appointmentService'
import ViewToggle from '@/components/ViewToggle'
import FilterButtons from '@/components/FilterButtons'
import AppointmentForm from '@/components/AppointmentForm'
import AppointmentList from '@/components/AppointmentList'
import CalendarView from '@/components/CalendarView'
import { useTranslation } from '@/components/TranslationProvider'

export default function Home() {
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [prefilledData, setPrefilledData] = useState(null)
  const [view, setView] = useState('list') // 'list' or 'calendar'
  const [filter, setFilter] = useState('upcoming') // Default to 'upcoming'
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week
  const { t } = useTranslation()

  // Load appointments on mount
  useEffect(() => {
    fetchAppointments()
  }, [])

  // Filter appointments whenever they change or filter changes
  useEffect(() => {
    const filtered = filterAppointments(appointments, filter)
    setFilteredAppointments(filtered)
  }, [appointments, filter])

  async function fetchAppointments() {
    setLoading(true)
    const { data, error } = await loadAppointments()

    if (error) {
      console.error('Error loading appointments:', error)
      alert(t('appointmentsPage.errors.load', { message: error.message }))
    } else {
      setAppointments(data)
    }
    setLoading(false)
  }

  async function handleCreateAppointment(formData) {
    const { data, error } = await createAppointment(formData)

    if (error) {
      alert(t('appointmentsPage.errors.create', { message: error.message }))
    } else {
      setAppointments([...appointments, ...data])
      setShowForm(false)
    }
  }

  async function handleUpdateAppointment(formData) {
    const { data, error } = await updateAppointment(editingAppointment.id, formData)

    if (error) {
      alert(t('appointmentsPage.errors.update', { message: error.message }))
    } else {
      // Refetch all appointments to get updated data with relations (customer address, etc.)
      await fetchAppointments()
      setEditingAppointment(null)
      setShowForm(false)
    }
  }

  function handleEditAppointment(appointment) {
    setEditingAppointment(appointment)
    setShowForm(true)
  }

  function handleCancelEdit() {
    setEditingAppointment(null)
    setPrefilledData(null)
    setShowForm(false)
  }

  function handleViewChange(newView) {
    if (showForm || editingAppointment) {
      if (confirm(t('appointmentsPage.confirmDiscard'))) {
        handleCancelEdit()
        setView(newView)
      }
    } else {
      setView(newView)
    }
  }

  function handleCreateAtSlot(date, time) {
    setPrefilledData({
      appointment_date: date,
      appointment_time: time
    })
    setEditingAppointment(null)
    setShowForm(true)
  }

  async function handleMarkCompleted(id) {
    const { error } = await updateAppointmentStatus(id, 'completed')

    if (error) {
      alert(t('appointmentsPage.errors.updateStatus', { message: error.message }))
    } else {
      fetchAppointments()
    }
  }

  async function handleDeleteAppointment(id) {
    if (!confirm(t('appointmentsPage.confirmDelete'))) return

    const { error } = await deleteAppointmentService(id)

    if (error) {
      alert(t('appointmentsPage.errors.delete', { message: error.message }))
    } else {
      setAppointments(appointments.filter((apt) => apt.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-600">{t('appointmentsPage.loading')}</div>
      </div>
    )
  }

  const displayedCount = view === 'list' ? filteredAppointments.length : appointments.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {t('appointmentsPage.headingWithCount', { count: displayedCount })}
        </h2>
      </div>

      {/* View Toggle & Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
        <ViewToggle view={view} onViewChange={handleViewChange} />
        {view === 'list' && <FilterButtons filter={filter} onFilterChange={setFilter} />}
      </div>

      {/* Add Appointment Button - Only in List View */}
      {view === 'list' && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-200 flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            <span>{t('appointmentsPage.newButton')}</span>
          </button>
        </div>
      )}

      {/* Add/Edit Appointment Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black bg-opacity-50 px-3 py-4 sm:px-6 sm:py-10 overflow-y-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="w-full max-w-4xl">
            <div className="max-h-[95vh] overflow-y-auto">
              <AppointmentForm
                onSubmit={editingAppointment ? handleUpdateAppointment : handleCreateAppointment}
                onCancel={handleCancelEdit}
                initialData={editingAppointment || prefilledData}
              />
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <CalendarView
          appointments={appointments}
          weekOffset={weekOffset}
          onWeekChange={setWeekOffset}
          onComplete={handleMarkCompleted}
          onEdit={handleEditAppointment}
          onCreateAtSlot={handleCreateAtSlot}
        />
      )}

      {/* List View */}
      {view === 'list' && (
        <AppointmentList
          appointments={filteredAppointments}
          filter={filter}
          onComplete={handleMarkCompleted}
          onDelete={handleDeleteAppointment}
          onEdit={handleEditAppointment}
        />
      )}
    </div>
  )
}
