import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const ALLOWED_ACTIONS = ['purge_appointments', 'purge_customers', 'purge_services', 'purge_all']

export async function POST(request, { params }) {
  const { error: authError } = await getAdminUser()
  if (authError) return authError

  const accountId = params?.accountId
  if (!accountId) {
    return NextResponse.json({ error: 'Missing accountId' }, { status: 400 })
  }

  const payload = await request.json().catch(() => null)
  const action = payload?.action

  if (!ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  try {
    if (action === 'purge_all') {
      await purgeAppointments(accountId)
      await purgeServices(accountId)
      await purgeCustomers(accountId)
    } else if (action === 'purge_appointments') {
      await purgeAppointments(accountId)
    } else if (action === 'purge_customers') {
      await purgeCustomers(accountId)
    } else if (action === 'purge_services') {
      await purgeServices(accountId)
    }
  } catch (error) {
    console.error('[maintenance] purge error', { action, accountId, error })
    return NextResponse.json({ error: 'Failed to execute action' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

async function purgeAppointments(accountId) {
  await supabaseAdmin.from('appointments').delete().eq('account_id', accountId)
}

async function purgeCustomers(accountId) {
  // This may cascade to pets if FKs are set; adjust as needed.
  await supabaseAdmin.from('customers').delete().eq('account_id', accountId)
}

async function purgeServices(accountId) {
  await supabaseAdmin.from('services').delete().eq('account_id', accountId)
}

async function getAdminUser() {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (!isPlatformAdmin(user)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user }
}

function isPlatformAdmin(user) {
  const adminList = (process.env.NEXT_PUBLIC_PLATFORM_ADMIN_EMAILS || process.env.PLATFORM_ADMIN_EMAILS || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
  const email = user?.email?.toLowerCase()
  return email && adminList.includes(email)
}
