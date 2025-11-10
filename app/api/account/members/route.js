import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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

async function enrichMembers(members) {
  return Promise.all(
    members.map(async (member) => {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(member.user_id)
      return {
        ...member,
        email: error ? '' : data.user?.email || ''
      }
    })
  )
}

export async function GET(request) {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId')

  if (!accountId) {
    return NextResponse.json({ error: 'Missing accountId' }, { status: 400 })
  }

  const allowed = await assertAccountAdmin(user.id, accountId)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('account_members')
    .select('id, account_id, user_id, role, status, created_at')
    .eq('account_id', accountId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const members = await enrichMembers(data || [])

  return NextResponse.json({ members })
}

export async function POST(request) {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json()
  const { accountId, email, password, role = 'member' } = payload || {}

  if (!accountId || !email) {
    return NextResponse.json({ error: 'Missing accountId or email' }, { status: 400 })
  }

  const allowed = await assertAccountAdmin(user.id, accountId)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const safeRole = ['owner', 'admin', 'member'].includes(role) ? role : 'member'

  const {
    data: { user: newUser },
    error: createError
  } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: password || crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      account_id: accountId
    }
  })

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('account_members')
    .insert({
      account_id: accountId,
      user_id: newUser.id,
      role: safeRole,
      status: 'accepted'
    })
    .select('id, account_id, user_id, role, status, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    member: {
      ...data,
      email: newUser.email
    }
  })
}
