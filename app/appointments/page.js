// ============================================
// FILE: app/page.js
// Main page - Refactored with modular components
// ============================================
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import {
  loadAppointments,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  updateAppointmentPaymentStatus,
  deleteAppointment as deleteAppointmentService,
  filterAppointments,
  markWhatsappSent
} from '@/lib/appointmentService'
import { supabase } from '@/lib/supabase'
import ViewToggle from '@/components/ViewToggle'
import FilterButtons from '@/components/FilterButtons'
import { useTranslation } from '@/components/TranslationProvider'
import { compressImage } from '@/utils/image'
import styles from './appointments.module.css'
import { formatDate, formatTime } from '@/utils/dateUtils'

const APPOINTMENT_PHOTO_BUCKET = 'appointment-photos'

const LoadingCard = ({ labelKey }) => {
  const { t, resolvedLocale } = useTranslation()
  return (
    <div className="bg-white rounded-2xl shadow-md border border-brand-primary/20 p-6 text-center text-gray-500 animate-pulse">
      {t(labelKey)}
    </div>
  )
}

const CalendarView = dynamic(() => import('@/components/CalendarView'), {
  ssr: false,
  loading: () => <LoadingCard labelKey="appointmentsPage.loaders.calendar" />
})

const AppointmentList = dynamic(() => import('@/components/AppointmentList'), {
  loading: () => <LoadingCard labelKey="appointmentsPage.loaders.list" />
})

const AppointmentForm = dynamic(() => import('@/components/AppointmentForm'), {
  ssr: false,
  loading: () => <LoadingCard labelKey="appointmentsPage.loaders.form" />
})

export default function Home() {
  const hasLoadedRef = useRef(false)
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [prefilledData, setPrefilledData] = useState(null)
  const [view, setView] = useState('calendar') // 'list' or 'calendar'
  const [filter, setFilter] = useState('upcoming') // Default to 'upcoming'
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week
  const [sharePreview, setSharePreview] = useState(null)
  const { t, resolvedLocale } = useTranslation()

  useEffect(() => {
    if (!showForm) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [showForm])

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
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    fetchAppointments()
  }, [fetchAppointments])

  // Filter appointments whenever they change or filter changes
  useEffect(() => {
    const filtered = filterAppointments(appointments, filter)
    setFilteredAppointments(filtered)
  }, [appointments, filter])

  const openWhatsAppForAppointment = (appointment, { forceRedirect = false } = {}) => {
    if (!appointment?.public_token || !appointment?.id) {
      alert(t('appointmentForm.messages.noShareToken'))
      return
    }
    const phoneNumber = appointment.customers?.phone || ''
    const phoneDigits = phoneNumber.replace(/\D/g, '')
    if (!phoneDigits) {
      alert(t('appointmentForm.messages.selectCustomerFirst'))
      return
    }

    const dateText = formatDate(appointment.appointment_date, resolvedLocale)
    const timeText = formatTime(appointment.appointment_time, resolvedLocale)
    const customerName = appointment.customers?.name
    const petName = appointment.pets?.name
    const petBreed = appointment.pets?.breed
    const serviceName = appointment.services?.name
    const address = appointment.customers?.address

    const introMessage = customerName
      ? t('appointmentCard.share.messageWithName', {
          customer: customerName,
          date: dateText,
          time: timeText
        })
      : t('appointmentCard.share.messageNoName', {
          date: dateText,
          time: timeText
        })

    const confirmationUrl = `${window.location.origin}/appointments/confirm?id=${appointment.id}&token=${appointment.public_token}`

    const detailLines = [
      serviceName && t('appointmentCard.share.service', { service: serviceName }),
      petName && t('appointmentCard.share.pet', { pet: petBreed ? `${petName} (${petBreed})` : petName }),
      address && t('appointmentCard.share.address', { address }),
      t('appointmentCard.share.link', { url: confirmationUrl })
    ].filter(Boolean)

    const messageBody = [introMessage, '', ...detailLines].join('\n')

    const waUrl = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(messageBody)}`
    setSharePreview({ message: messageBody, waUrl, forceRedirect, id: appointment.id })
  }

  async function handleCreateAppointment(formData, media = {}, options = { sendWhatsapp: false }) {
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
      const created = data?.[0] || null

      if (options?.sendWhatsapp && created?.id) {
        // Fetch fresh data to ensure relations/public_token are present
        const { data: latest } = await loadAppointments()
        if (latest && Array.isArray(latest)) {
          setAppointments(latest)
          const match = latest.find((apt) => apt.id === created.id) || created
          openWhatsAppForAppointment(match, { forceRedirect: true })
        } else {
          openWhatsAppForAppointment(created, { forceRedirect: true })
          await fetchAppointments()
        }
      } else {
        await fetchAppointments()
      }

      setShowForm(false)
    }
  }

  async function handleUpdateAppointment(formData, media = {}, _options = {}) {
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
      if (editingAppointment?.id === id) {
        setEditingAppointment((prev) => (prev ? { ...prev, status: 'completed' } : prev))
      }
    }
  }

  async function handleTogglePayment(appointment) {
    const nextStatus = appointment.payment_status === 'paid' ? 'unpaid' : 'paid'
    const { error } = await updateAppointmentPaymentStatus(appointment.id, nextStatus)

    if (error) {
      alert(t('appointmentsPage.errors.updateStatus', { message: error.message }))
    } else {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointment.id ? { ...apt, payment_status: nextStatus } : apt
        )
      )
      setFilteredAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointment.id ? { ...apt, payment_status: nextStatus } : apt
        )
      )
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
      if (editingAppointment?.id === id) {
        setEditingAppointment(null)
        setShowForm(false)
      }
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-800">
          {t('appointmentsPage.headingWithCount', { count: displayedCount })}
        </h2>
        <ViewToggle view={view} onViewChange={handleViewChange} />
      </div>

      {/* Filters */}
      {view === 'list' && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <FilterButtons filter={filter} onFilterChange={setFilter} />
        </div>
      )}

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
        <div className={styles.cardWrapper}>
          <AppointmentList
            appointments={filteredAppointments}
            filter={filter}
            onComplete={handleMarkCompleted}
            onDelete={handleDeleteAppointment}
            onEdit={handleEditAppointment}
            onTogglePayment={handleTogglePayment}
          />
        </div>
      )}
    </div>
  )

  return (
    <>
      {pageContent}
      {sharePreview && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">
              {t('appointmentForm.sharePreview.title')}
            </h3>
            <p className="text-sm text-slate-600">
              {t('appointmentForm.sharePreview.helper')}
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <pre className="whitespace-pre-wrap text-sm text-slate-800">{sharePreview.message}</pre>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  if (sharePreview.forceRedirect) {
                    window.location.href = sharePreview.waUrl
                  } else {
                    window.open(sharePreview.waUrl, '_blank', 'noopener,noreferrer')
                  }
                  if (sharePreview.id) {
                    markWhatsappSent(sharePreview.id).catch(() => {})
                  }
                  setSharePreview(null)
                }}
                className="w-full rounded-xl bg-emerald-500 text-white font-semibold py-3 hover:bg-emerald-600 transition"
              >
                <span className="inline-flex items-center gap-2 justify-center">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      fill="#25D366"
                      d="M16 3C9.375 3 4 8.373 4 15c0 2.591.782 4.997 2.125 7.009L4 29l7.219-2.09C12.97 27.59 14.455 28 16 28c6.627 0 12-5.373 12-12S22.627 3 16 3Z"
                    />
                    <path
                      fill="#fff"
                      d="M23.484 20.398c-.299.846-1.45 1.545-2.367 1.75-.63.14-1.45.25-4.219-.903-3.538-1.466-5.807-5.063-5.983-5.303-.176-.24-1.426-1.903-1.426-3.63 0-1.726.904-2.572 1.226-2.93.322-.357.703-.446.937-.446.234 0 .468 0 .674.012.217.012.51-.082.798.61.299.716 1.017 2.476 1.108 2.656.09.18.15.39.03.63-.12.24-.18.39-.35.6-.18.216-.37.48-.53.645-.18.18-.37.375-.16.732.21.357.928 1.53 1.993 2.476 1.37 1.226 2.526 1.61 2.883 1.79.357.18.563.15.773-.09.21-.24.896-1.05 1.14-1.41.234-.36.48-.3.804-.18.323.12 2.06.97 2.414 1.144.357.18.59.27.674.42.083.15.083.87-.216 1.716Z"
                    />
                  </svg>
                  {t('appointmentForm.sharePreview.confirm')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSharePreview(null)}
                className="w-full rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold py-3 hover:bg-slate-50 transition"
              >
                {t('appointmentForm.sharePreview.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add/Edit Appointment Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-primary/10 sm:bg-brand-primary/20 backdrop-blur-none sm:backdrop-blur-md px-3 py-4 sm:px-10 sm:py-12 overflow-y-auto transition"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl sm:shadow-2xl border border-brand-primary/30">
            <div className="max-h-[90vh] overflow-y-auto p-4 sm:p-8">
              <AppointmentForm
                onSubmit={editingAppointment ? handleUpdateAppointment : handleCreateAppointment}
                onCancel={handleCancelEdit}
                initialData={editingAppointment || prefilledData}
                onDelete={
                  editingAppointment ? () => handleDeleteAppointment(editingAppointment.id) : undefined
                }
                onMarkCompleted={
                  editingAppointment ? () => handleMarkCompleted(editingAppointment.id) : undefined
                }
                onShare={openWhatsAppForAppointment}
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
