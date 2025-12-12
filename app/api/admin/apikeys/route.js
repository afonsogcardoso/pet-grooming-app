import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const MAX_PAGE_SIZE = 100

export async function GET(request) {
  const { user, error: authError } = await getAdminUser()
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId')
  const status = normalizeStatus(searchParams.get('status'))
  const search = (searchParams.get('search') || '').trim()
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
  const pageSize = clampPageSize(parseInt(searchParams.get('pageSize') || '20', 10))

  let query = supabaseAdmin
    .from('api_keys')
    .select('id, account_id, name, key_prefix, status, created_at, last_used_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    const escaped = search.replace(/%/g, '\\%').replace(/_/g, '\\_')
    query = query.or(`name.ilike.%${escaped}%,key_prefix.ilike.%${escaped}%`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query.range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    keys: data || [],
    total: count ?? 0,
    page,
    pageSize
  })
}

export async function POST(request) {
  const { user, error: authError } = await getAdminUser()
  if (authError) return authError

  const payload = await request.json().catch(() => null)
  const { accountId, name } = payload || {}

  if (!accountId || !name) {
    return NextResponse.json({ error: 'Missing accountId or name' }, { status: 400 })
  }

  const { key, prefix, hash } = generateKey()

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .insert({
      account_id: accountId,
      name: name.trim(),
      key_prefix: prefix,
      key_hash: hash,
      status: 'active',
      created_by: user.id
    })
    .select('id, account_id, name, key_prefix, status, created_at, last_used_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return the plaintext key only once
  return NextResponse.json({
    key,
    record: data
  })
}

export async function PATCH(request) {
  const { error: authError } = await getAdminUser()
  if (authError) return authError

  const payload = await request.json().catch(() => null)
  const { id, status } = payload || {}

  if (!id || !status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
  }

  if (!['active', 'revoked'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .update({ status })
    .eq('id', id)
    .select('id, account_id, name, key_prefix, status, created_at, last_used_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ key: data })
}

export async function DELETE(request) {
  const { error: authError } = await getAdminUser()
  if (authError) return authError

  const payload = await request.json().catch(() => null)
  const { id } = payload || {}

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .delete()
    .eq('id', id)
    .eq('status', 'revoked')
    .select('id')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Key not found or not revoked' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

function clampPageSize(value) {
  if (!value || Number.isNaN(value)) return 20
  return Math.max(1, Math.min(value, MAX_PAGE_SIZE))
}

function normalizeStatus(value) {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  return ['active', 'revoked'].includes(normalized) ? normalized : null
}

function generateKey() {
  const raw = crypto.randomBytes(24).toString('base64url')
  const key = `pk_live_${raw}`
  const prefix = key.slice(0, 8)
  const hash = crypto.createHash('sha256').update(key).digest('hex')
  return { key, prefix, hash }
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
