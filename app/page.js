// ============================================
// FILE: app/page.js
// Main page - Refactored with modular components
// ============================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  loadAppointments,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment as deleteAppointmentService,
  filterAppointments
} from '@/lib/appointmentService'
import { supabase } from '@/lib/supabase'
import ViewToggle from '@/components/ViewToggle'
import FilterButtons from '@/components/FilterButtons'
import AppointmentForm from '@/components/AppointmentForm'
import AppointmentList from '@/components/AppointmentList'
import CalendarView from '@/components/CalendarView'
import { useTranslation } from '@/components/TranslationProvider'
import { compressImage } from '@/utils/image'

const APPOINTMENT_PHOTO_BUCKET = 'appointment-photos'

export default function Home() {
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [prefilledData, setPrefilledData] = useState(null)
  const [view, setView] = useState('calendar') // 'list' or 'calendar'
  const [filter, setFilter] = useState('upcoming') // Default to 'upcoming'
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week
  const { t } = useTranslation()

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    const { data, error } = await loadAppointments()

    if (error) {
      console.error('Error loading appointments:', error)
      alert(t('appointmentsPage.errors.load', { message: error.message }))
    } else {
      setAppointments(data)
    }
    setLoading(false)
  }, [t])

  // Load appointments on mount
  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // Filter appointments whenever they change or filter changes
  useEffect(() => {
    const filtered = filterAppointments(appointments, filter)
    setFilteredAppointments(filtered)
  }, [appointments, filter])

  async function handleCreateAppointment(formData, media = {}) {
    const payload = { ...formData }

    try {
      if (media.beforePhotoFile) {
        payload.before_photo_url = await uploadAppointmentPhoto(media.beforePhotoFile, 'before')
      } else if (media.removeBeforePhoto) {
        payload.before_photo_url = null
        if (media.currentBeforePhotoUrl) {
          await deleteAppointmentPhoto(media.currentBeforePhotoUrl)
        }
      }

      if (media.afterPhotoFile) {
        payload.after_photo_url = await uploadAppointmentPhoto(media.afterPhotoFile, 'after')
      } else if (media.removeAfterPhoto) {
        payload.after_photo_url = null
        if (media.currentAfterPhotoUrl) {
          await deleteAppointmentPhoto(media.currentAfterPhotoUrl)
        }
      }
    } catch (photoError) {
      alert(t('appointmentsPage.errors.photoUpload', { message: photoError.message }))
      return
    }

    const { data, error } = await createAppointment(payload)

    if (error) {
      alert(t('appointmentsPage.errors.create', { message: error.message }))
    } else {
      await fetchAppointments()
      setShowForm(false)
    }
  }

  async function handleUpdateAppointment(formData, media = {}) {
    const payload = {
      ...formData,
      before_photo_url: editingAppointment?.before_photo_url || null,
      after_photo_url: editingAppointment?.after_photo_url || null
    }

    try {
      if (media.beforePhotoFile) {
        payload.before_photo_url = await uploadAppointmentPhoto(media.beforePhotoFile, 'before')
        if (media.currentBeforePhotoUrl) {
          await deleteAppointmentPhoto(media.currentBeforePhotoUrl)
        }
      } else if (media.removeBeforePhoto && media.currentBeforePhotoUrl) {
        payload.before_photo_url = null
        await deleteAppointmentPhoto(media.currentBeforePhotoUrl)
      }

      if (media.afterPhotoFile) {
        payload.after_photo_url = await uploadAppointmentPhoto(media.afterPhotoFile, 'after')
        if (media.currentAfterPhotoUrl) {
          await deleteAppointmentPhoto(media.currentAfterPhotoUrl)
        }
      } else if (media.removeAfterPhoto && media.currentAfterPhotoUrl) {
        payload.after_photo_url = null
        await deleteAppointmentPhoto(media.currentAfterPhotoUrl)
      }
    } catch (photoError) {
      alert(t('appointmentsPage.errors.photoUpload', { message: photoError.message }))
      return
    }

    const { data, error } = await updateAppointment(editingAppointment.id, payload)

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
      await fetchAppointments()
    }
  }

  async function handleDeleteAppointment(id) {
    if (!confirm(t('appointmentsPage.confirmDelete'))) return

    const target = appointments.find((apt) => apt.id === id)
    const { error } = await deleteAppointmentService(id)

    if (error) {
      alert(t('appointmentsPage.errors.delete', { message: error.message }))
    } else {
      if (target?.before_photo_url) {
        await deleteAppointmentPhoto(target.before_photo_url)
      }
      if (target?.after_photo_url) {
        await deleteAppointmentPhoto(target.after_photo_url)
      }
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

  const pageContent = (
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
            className="btn-brand shadow-brand-glow py-3 px-6 flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            <span>{t('appointmentsPage.newButton')}</span>
          </button>
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

  return (
    <>
      {pageContent}
      {/* Add/Edit Appointment Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-primary/20 backdrop-blur-md px-3 py-4 sm:px-10 sm:py-12 overflow-y-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-brand-primary/30">
            <div className="max-h-[90vh] overflow-y-auto p-4 sm:p-8">
              <AppointmentForm
                onSubmit={editingAppointment ? handleUpdateAppointment : handleCreateAppointment}
                onCancel={handleCancelEdit}
                initialData={editingAppointment || prefilledData}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
function generatePhotoPath(tag) {
  const unique =
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`
  return `appointments/${unique}-${tag}.jpg`
}

async function uploadAppointmentPhoto(file, tag) {
  const compressed = await compressImage(file, { maxSize: 1024 })
  const filePath = generatePhotoPath(tag)
  const { error } = await supabase.storage
    .from(APPOINTMENT_PHOTO_BUCKET)
    .upload(filePath, compressed, { upsert: true, contentType: 'image/jpeg' })

  if (error) {
    throw new Error(error.message)
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from(APPOINTMENT_PHOTO_BUCKET).getPublicUrl(filePath)

  return publicUrl || null
}

function extractAppointmentStoragePath(url) {
  if (!url) return null
  const marker = `${APPOINTMENT_PHOTO_BUCKET}/`
  const parts = url.split(marker)
  return parts[1] || null
}

async function deleteAppointmentPhoto(url) {
  const path = extractAppointmentStoragePath(url)
  if (!path) return
  await supabase.storage.from(APPOINTMENT_PHOTO_BUCKET).remove([path])
}
