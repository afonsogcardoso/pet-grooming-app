import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request, { params }) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user || !isPlatformAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const newPassword = body?.newPassword
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Password inválida (mínimo 8 caracteres).' }, { status: 400 })
  }

  const targetUserId = params.userId
  if (!targetUserId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, { password: newPassword })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

function isPlatformAdmin(user) {
  if (!user) return false
  const flag = user?.user_metadata?.platform_admin || user?.app_metadata?.platform_admin
  const roleArray = Array.isArray(user?.app_metadata?.roles) ? user.app_metadata.roles : []
  if (flag === true || flag === 'true' || flag === 1 || flag === '1') {
    return true
  }
  if (roleArray.includes('platform_admin')) return true
  const bootstrap = process.env.NEXT_PUBLIC_PLATFORM_ADMIN_EMAILS || process.env.PLATFORM_ADMIN_EMAILS || ''
  const allowed = bootstrap
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes((user.email || '').toLowerCase())
}
