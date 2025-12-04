import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const APPOINTMENT_CONFIRM_SELECT = `
  id,
  appointment_date,
  appointment_time,
  duration,
  notes,
  status,
  payment_status,
  account_id,
  public_token,
  customers ( id, name, phone, address ),
  pets ( id, name, breed ),
  services ( id, name )
`

function formatIcsDateUtc(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  )
}

function escapeText(value = '') {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const token = searchParams.get('token')

  if (!id || !token) {
    return NextResponse.json({ error: 'missing_parameters' }, { status: 400 })
  }

  const { data: appointment, error } = await supabaseAdmin
    .from('appointments')
    .select(APPOINTMENT_CONFIRM_SELECT)
    .eq('id', id)
    .eq('public_token', token)
    .maybeSingle()

  if (error || !appointment) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const startDate = new Date(`${appointment.appointment_date}T${(appointment.appointment_time || '00:00').slice(0, 5)}:00`)
  const endDate = new Date(startDate)
  endDate.setMinutes(endDate.getMinutes() + (appointment.duration || 60))

  const titleParts = [
    appointment.services?.name,
    appointment.pets?.name || appointment.customers?.name || ''
  ].filter(Boolean)
  const summary = titleParts.join(' • ') || 'Appointment'

  const descriptionParts = [
    appointment.notes,
    appointment.customers?.address
  ].filter(Boolean)
  const description = escapeText(descriptionParts.join('\n'))

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'PRODID:-//Pet Grooming//EN',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@pet-grooming`,
    `DTSTAMP:${formatIcsDateUtc(new Date())}`,
    `DTSTART:${formatIcsDateUtc(startDate)}`,
    `DTEND:${formatIcsDateUtc(endDate)}`,
    `SUMMARY:${escapeText(summary)}`,
    description ? `DESCRIPTION:${description}` : null,
    appointment.customers?.address ? `LOCATION:${escapeText(appointment.customers.address)}` : null,
    'END:VEVENT',
    'END:VCALENDAR'
  ]
    .filter(Boolean)
    .join('\r\n')

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="appointment-${appointment.appointment_date}.ics"`
    }
  })
}
