import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const ALLOWED_LOCALES = ['pt', 'en']

export async function PATCH(request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  const { displayName, phone, locale, avatarUrl } = payload || {}

  const metadataUpdates = {}
  if (displayName !== undefined) {
    metadataUpdates.display_name = displayName?.trim() || null
  }
  if (phone !== undefined) {
    metadataUpdates.phone = phone?.trim() || null
  }

  if (locale !== undefined) {
    const normalized = ALLOWED_LOCALES.includes(locale) ? locale : null
    metadataUpdates.preferred_locale = normalized || null
  }
  if (avatarUrl !== undefined) {
    metadataUpdates.avatar_url = avatarUrl || null
  }

  if (!Object.keys(metadataUpdates).length) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  }

  const mergedMetadata = {
    ...(user.user_metadata || {}),
    ...metadataUpdates
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: mergedMetadata
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ user: data.user })
}
