import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { runDefaultAccountSeed } from '@/lib/admin/accountSeed'
import { writeAdminLog } from '@/lib/admin/logHelpers'
import { findUserByEmail } from '@/lib/admin/userHelpers'

const MAX_PAGE_SIZE = 50
const FACET_LIMIT = 200

export async function GET(request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isPlatformAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
  const pageSize = clampPageSize(parseInt(searchParams.get('pageSize') || '10', 10) || 10)
  const plan = normalizeFilter(searchParams.get('plan'))
  const status = normalizeFilter(searchParams.get('status'))
  const search = normalizeSearch(searchParams.get('search'))

  let query = supabaseAdmin
    .from('accounts')
    .select('id, name, slug, plan, is_active, created_at, brand_primary, brand_accent', { count: 'exact' })

  if (plan) {
    query = query.eq('plan', plan)
  }

  if (status) {
    query = query.eq('is_active', status === 'active')
  }

  if (search) {
    const escaped = escapeSearch(search)
    query = query.or(`name.ilike.%${escaped}%,slug.ilike.%${escaped}%`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const [planOptions] = await Promise.all([fetchDistinctPlans()])

  return NextResponse.json({
    accounts: data || [],
    total: count ?? 0,
    page,
    pageSize,
    planOptions,
    statusOptions: ['active', 'inactive']
  })
}

export async function POST(request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isPlatformAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload = await request.json().catch(() => null)
  const { name, slug, plan = 'standard', ownerEmail, ownerName, template = 'basic' } = payload || {}

  if (!name) {
    return NextResponse.json({ error: 'Nome obrigatório.' }, { status: 400 })
  }

  const normalizedSlug = sanitizeSlug(slug || name)
  if (!normalizedSlug) {
    return NextResponse.json({ error: 'Slug inválido.' }, { status: 400 })
  }

  const accountPayload = {
    name: name.trim(),
    slug: normalizedSlug,
    plan: plan?.trim() || 'standard',
    is_active: true
  }

  const { data: account, error } = await supabaseAdmin
    .from('accounts')
    .insert(accountPayload)
    .select('id, name, slug, plan, is_active, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug já está a ser usado.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let seedResult = null
  try {
    seedResult = await runDefaultAccountSeed(account, template)
  } catch (seedError) {
    console.error('Account seed failed', seedError)
    seedResult = { skipped: true, error: seedError.message }
  }

  let ownerResult = null
  if (ownerEmail) {
    try {
      ownerResult = await ensureOwner(account, ownerEmail, ownerName)
    } catch (ownerError) {
      console.error('Owner assignment failed', ownerError)
      ownerResult = { error: ownerError.message }
    }
  }

  await writeAdminLog({
    actorId: user.id,
    action: 'account.create',
    targetId: account.id,
    payload: {
      account,
      seed: seedResult,
      owner: ownerResult
    }
  })

  return NextResponse.json({
    account,
    seed: seedResult,
    owner: ownerResult
  })
}

export async function PATCH(request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isPlatformAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload = await request.json().catch(() => null)
  const { accountId, updates } = payload || {}

  if (!accountId || !updates) {
    return NextResponse.json({ error: 'Missing accountId or updates' }, { status: 400 })
  }

  const allowedFields = ['name', 'plan', 'is_active']
  const sanitizedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
    if (!allowedFields.includes(key)) return acc
    if (key === 'name' || key === 'plan') {
      acc[key] = typeof value === 'string' ? value.trim() : value
    } else {
      acc[key] = value
    }
    return acc
  }, {})

  if (!Object.keys(sanitizedUpdates).length) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('accounts')
    .update(sanitizedUpdates)
    .eq('id', accountId)
    .select('id, name, slug, plan, is_active, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await writeAdminLog({
    actorId: user.id,
    action: 'account.update',
    targetId: accountId,
    payload: sanitizedUpdates
  })

  return NextResponse.json({ account: data })
}

export async function PUT(request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isPlatformAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload = await request.json().catch(() => null)
  const { accountIds, action } = payload || {}

  if (
    !Array.isArray(accountIds) ||
    !accountIds.length ||
    !['archive', 'restore', 'delete'].includes(action)
  ) {
    return NextResponse.json({ error: 'Invalid bulk action payload' }, { status: 400 })
  }

  if (action === 'delete') {
    const { error: deleteError } = await supabaseAdmin.from('accounts').delete().in('id', accountIds)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }
    await writeAdminLog({
      actorId: user.id,
      action: 'account.bulk_delete',
      payload: { ids: accountIds }
    })

    return NextResponse.json({ deleted: accountIds.length })
  }

  const isActive = action === 'restore'

  const { error } = await supabaseAdmin
    .from('accounts')
    .update({ is_active: isActive })
    .in('id', accountIds)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await writeAdminLog({
    actorId: user.id,
    action: action === 'archive' ? 'account.bulk_archive' : 'account.bulk_restore',
    payload: { ids: accountIds }
  })

  return NextResponse.json({ updated: accountIds.length })
}

function clampPageSize(value) {
  if (!Number.isFinite(value)) return 10
  return Math.max(1, Math.min(MAX_PAGE_SIZE, value))
}

function normalizeFilter(value) {
  if (!value || value === 'all') {
    return null
  }
  return value.trim()
}

function normalizeSearch(value) {
  if (!value) return ''
  return value.trim()
}

function escapeSearch(value) {
  return value.replace(/[%_]/g, (match) => `\\${match}`).replace(/,/g, ' ')
}

async function fetchDistinctPlans() {
  const { data, error } = await supabaseAdmin
    .from('accounts')
    .select('plan')
    .not('plan', 'is', null)
    .limit(FACET_LIMIT)

  if (error || !data) {
    return []
  }

  const unique = Array.from(new Set(data.map((row) => row?.plan).filter(Boolean)))
  return unique.sort((a, b) => a.localeCompare(b))
}

function isPlatformAdmin(user) {
  if (!user) return false

  const metadataFlag = extractFlag(user.user_metadata) || extractFlag(user.app_metadata)
  const rolesFlag = Array.isArray(user?.app_metadata?.roles)
    ? user.app_metadata.roles.includes('platform_admin')
    : false

  if (metadataFlag || rolesFlag) {
    return true
  }

  const bootstrapEmails = process.env.NEXT_PUBLIC_PLATFORM_ADMIN_EMAILS || process.env.PLATFORM_ADMIN_EMAILS
  if (bootstrapEmails) {
    const allowed = bootstrapEmails
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
    return allowed.includes((user.email || '').toLowerCase())
  }

  return false
}

function extractFlag(metadata) {
  if (!metadata) return false
  const value = metadata.platform_admin
  return value === true || value === 'true' || value === 1 || value === '1'
}

function sanitizeSlug(value) {
  if (!value) return ''
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function ensureOwner(account, email, ownerName) {
  const normalizedEmail = String(email).trim().toLowerCase()
  if (!normalizedEmail) {
    throw new Error('Email inválido para o owner.')
  }

  let ownerUser = null
  try {
    ownerUser = await findUserByEmail(normalizedEmail)
  } catch (error) {
    throw new Error(error.message)
  }

  if (!ownerUser) {
    const {
      data: created,
      error: createError
    } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: randomUUID(),
      email_confirm: true,
      user_metadata: {
        display_name: ownerName || '',
        account_id: account.id
      }
    })

    if (createError) {
      throw new Error(createError.message)
    }
    ownerUser = created.user
  }

  const { error } = await supabaseAdmin
    .from('account_members')
    .upsert(
      {
        account_id: account.id,
        user_id: ownerUser.id,
        role: 'owner',
        status: 'accepted'
      },
      { onConflict: 'account_id,user_id' }
    )
    .select('id')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const payload = {
    userId: ownerUser.id,
    email: ownerUser.email
  }

  return payload
}
