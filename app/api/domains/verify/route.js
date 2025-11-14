import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { verifyTxtRecord } from '@/lib/domainVerification'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

export async function POST(request) {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  const { accountId, domainId } = payload || {}

  if (!accountId || !domainId) {
    return NextResponse.json({ error: 'Missing accountId or domainId' }, { status: 400 })
  }

  const allowed = await assertAccountAdmin(user.id, accountId)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: domain, error: domainError } = await supabaseAdmin
    .from('custom_domains')
    .select('id, account_id, domain, slug, status, verification_token, last_error, verified_at')
    .eq('id', domainId)
    .eq('account_id', accountId)
    .maybeSingle()

  if (domainError) {
    return NextResponse.json({ error: domainError.message }, { status: 500 })
  }

  if (!domain) {
    return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
  }

  const expectedToken = domain.verification_token?.startsWith('verify=')
    ? domain.verification_token.trim()
    : `verify=${domain.verification_token}`

  let verificationResult
  try {
    verificationResult = await verifyTxtRecord({
      domain: domain.domain,
      token: expectedToken
    })
  } catch (error) {
    const { data: failedUpdate, error: failedUpdateError } = await supabaseAdmin
      .from('custom_domains')
      .update({
        last_error: error.message,
        last_checked_at: new Date().toISOString(),
        status: 'error'
      })
      .eq('id', domain.id)
      .select(
        'id, account_id, domain, slug, status, last_error, verification_token, last_checked_at, verified_at'
      )
      .maybeSingle()

    if (failedUpdateError) {
      return NextResponse.json({ error: failedUpdateError.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        error: error.message,
        domain: failedUpdate,
        verification: {
          matched: false,
          reason: error.message
        }
      },
      { status: 502 }
    )
  }

  const nextStatus = verificationResult.matched ? 'active' : 'error'
  const updatePayload = {
    status: nextStatus,
    last_checked_at: verificationResult.checkedAt,
    last_error: verificationResult.matched ? null : verificationResult.reason || 'TXT token not found'
  }

  if (verificationResult.matched) {
    updatePayload.verified_at = verificationResult.checkedAt
  }

  const { data: updatedDomain, error: updateError } = await supabaseAdmin
    .from('custom_domains')
    .update(updatePayload)
    .eq('id', domain.id)
    .select(
      'id, account_id, domain, slug, status, verification_token, last_error, last_checked_at, verified_at'
    )
    .maybeSingle()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    domain: updatedDomain,
    verification: {
      ...verificationResult
    }
  })
}
