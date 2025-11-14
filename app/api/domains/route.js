import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const DOMAIN_ROUTER_TOKEN = process.env.DOMAIN_ROUTER_TOKEN
const DOMAIN_REGEX = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i
const ALLOWED_RECORD_TYPES = ['txt', 'cname']

function normalizeDomain(domain) {
  if (!domain || typeof domain !== 'string') {
    return ''
  }
  return domain.trim().toLowerCase().replace(/\.$/, '')
}

function isValidDomain(domain) {
  if (!domain) return false
  if (domain.includes('://') || domain.includes('/')) {
    return false
  }
  return DOMAIN_REGEX.test(domain)
}

async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return null
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: authHeader
      }
    }
  })

  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

async function assertAccountAdmin(userId, accountId) {
  const { data, error } = await supabaseAdmin
    .from('account_members')
    .select('role')
    .eq('user_id', userId)
    .eq('account_id', accountId)
    .eq('status', 'accepted')
    .maybeSingle()

  if (error || !data) {
    return false
  }

  return ['owner', 'admin'].includes(data.role)
}

async function fetchAccount(accountId) {
  const { data, error } = await supabaseAdmin
    .from('accounts')
    .select('id, slug')
    .eq('id', accountId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const lookupDomain = searchParams.get('domain') || searchParams.get('host')

  if (lookupDomain) {
    if (!DOMAIN_ROUTER_TOKEN) {
      return NextResponse.json({ error: 'Domain resolver disabled' }, { status: 503 })
    }

    const resolverToken = request.headers.get('x-domain-resolver-token')
    if (resolverToken !== DOMAIN_ROUTER_TOKEN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const normalizedDomain = normalizeDomain(lookupDomain)
    if (!isValidDomain(normalizedDomain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('custom_domains')
      .select('id, account_id, domain, slug, status, verified_at')
      .eq('domain', normalizedDomain)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
    }

    return NextResponse.json({ domain: data })
  }

  const user = await getAuthenticatedUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accountId = searchParams.get('accountId')

  if (!accountId) {
    return NextResponse.json({ error: 'Missing accountId' }, { status: 400 })
  }

  const allowed = await assertAccountAdmin(user.id, accountId)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('custom_domains')
    .select(
      'id, account_id, domain, slug, status, dns_record_type, verification_token, verification_target, last_error, last_checked_at, verified_at, created_at, updated_at'
    )
    .eq('account_id', accountId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ domains: data || [] })
}

export async function POST(request) {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await readJson(request)
  const { accountId, domain, slug, dnsRecordType = 'txt', verificationTarget = null } = payload || {}

  if (!accountId || !domain) {
    return NextResponse.json({ error: 'Missing accountId or domain' }, { status: 400 })
  }

  const normalizedDomain = normalizeDomain(domain)
  if (!isValidDomain(normalizedDomain)) {
    return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
  }

  const recordType = dnsRecordType?.toLowerCase()
  if (!ALLOWED_RECORD_TYPES.includes(recordType)) {
    return NextResponse.json({ error: 'Invalid DNS record type' }, { status: 400 })
  }

  const allowed = await assertAccountAdmin(user.id, accountId)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let account
  try {
    account = await fetchAccount(accountId)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const normalizedSlug = (slug || account.slug || '').trim().toLowerCase()
  if (!normalizedSlug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  }

  if (normalizedSlug !== account.slug) {
    return NextResponse.json({ error: 'Slug must match the account slug' }, { status: 400 })
  }

  const { data: existingDomain } = await supabaseAdmin
    .from('custom_domains')
    .select('id')
    .eq('domain', normalizedDomain)
    .maybeSingle()

  if (existingDomain) {
    return NextResponse.json({ error: 'Domain already exists' }, { status: 409 })
  }

  const { data, error } = await supabaseAdmin
    .from('custom_domains')
    .insert({
      account_id: accountId,
      domain: normalizedDomain,
      slug: normalizedSlug,
      dns_record_type: recordType,
      verification_target: verificationTarget
    })
    .select(
      'id, account_id, domain, slug, status, dns_record_type, verification_token, verification_target, last_error, last_checked_at, verified_at, created_at, updated_at'
    )
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ domain: data }, { status: 201 })
}

export async function DELETE(request) {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await readJson(request)
  const { accountId, domainId } = payload || {}

  if (!accountId || !domainId) {
    return NextResponse.json({ error: 'Missing accountId or domainId' }, { status: 400 })
  }

  const allowed = await assertAccountAdmin(user.id, accountId)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('custom_domains')
    .delete()
    .eq('id', domainId)
    .eq('account_id', accountId)
    .select('id')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
