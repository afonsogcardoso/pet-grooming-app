import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const APPOINTMENT_CONFIRM_SELECT = `
  id,
  pet_id,
  public_token
`

const PET_PHOTO_BUCKET = 'pet-photos'

export const dynamic = 'force-dynamic'

async function getAppointment(id, token) {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select(APPOINTMENT_CONFIRM_SELECT)
    .eq('id', id)
    .eq('public_token', token)
    .maybeSingle()

  if (error) {
    console.error('pet-photo appointment fetch error', error)
    return null
  }
  return data || null
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const id = formData.get('id')
    const token = formData.get('token')
    const file = formData.get('file')

    if (!id || !token || !file) {
      return NextResponse.json({ ok: false, error: 'missing_parameters' }, { status: 400 })
    }

    // Validate size (~5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ ok: false, error: 'file_too_large' }, { status: 400 })
    }

    const appointment = await getAppointment(id, token)
    if (!appointment?.pet_id) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase()
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
    const uniqueId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`
    const path = `pets/${appointment.pet_id}/${uniqueId}.${safeExt}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(PET_PHOTO_BUCKET)
      .upload(path, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/jpeg'
      })

    if (uploadError) {
      console.error('pet photo upload error', uploadError)
      return NextResponse.json({ ok: false, error: 'upload_failed' }, { status: 500 })
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(PET_PHOTO_BUCKET).getPublicUrl(path)
    const publicUrl = publicUrlData?.publicUrl || null

    if (publicUrl) {
      await supabaseAdmin
        .from('pets')
        .update({ photo_url: publicUrl })
        .eq('id', appointment.pet_id)
    }

    return NextResponse.json({ ok: true, url: publicUrl })
  } catch (error) {
    console.error('pet photo upload exception', error)
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
