import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const MAX_PAGE_SIZE = 50

export async function GET(request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user || !isPlatformAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
  const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1), MAX_PAGE_SIZE)
  const search = (searchParams.get('search') || '').trim().toLowerCase()
  const role = searchParams.get('role') || 'all'

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const baseQuery = supabaseAdmin
    .from('account_members')
    .select(
      `
      user_id,
      role,
      status,
      created_at,
      account_id,
      account:accounts (id, name, slug)
    `
    )

  if (role !== 'all') {
    baseQuery.eq('role', role)
  }

  let { data: memberships, error } = await baseQuery
    .order('created_at', { ascending: true })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const grouped = memberships.reduce((acc, membership) => {
    const { user_id } = membership
    const bucket = acc.get(user_id) || []
    bucket.push(membership)
    acc.set(user_id, bucket)
    return acc
  }, new Map())

  const userIds = Array.from(grouped.keys())
  const usersResult = await fetchUsersByIds(userIds, search)

  const filteredUsers = usersResult.filter((entry) => grouped.has(entry.id))

  const responseUsers = filteredUsers.map((entry) => {
    const buckets = grouped.get(entry.id) || []
    const pendingInvites = buckets.filter((membership) => membership.status === 'pending').length
    return {
      id: entry.id,
      email: entry.email,
      displayName: entry.user_metadata?.display_name || '',
      phone: entry.user_metadata?.phone || '',
      lastSignIn: entry.last_sign_in_at,
      primaryAccountId: buckets[0]?.account_id || null,
      pendingInvites,
      tenants: buckets
    }
  })

  return NextResponse.json({ users: responseUsers, total: responseUsers.length })
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

async function fetchUsersByIds(ids, search) {
  if (ids.length === 0) return []
  try {
    const promises = ids.map((id) => supabaseAdmin.auth.admin.getUserById(id))
    const results = await Promise.all(promises)
    const users = results
      .map((result) => result?.data?.user)
      .filter(Boolean)
      .filter((user) => {
        if (!search) return true
        return (
          user.email?.toLowerCase().includes(search) || user.user_metadata?.display_name?.toLowerCase()?.includes(search)
        )
      })
    return users
  } catch (error) {
    console.error('Failed to fetch users by ids', error)
    return []
  }
}
