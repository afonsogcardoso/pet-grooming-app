import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeAdminLog } from '@/lib/admin/logHelpers'
import { findUserByEmail } from '@/lib/admin/userHelpers'

export async function GET(request, ctx) {
  const params = await ctx.params
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user || !isPlatformAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const accountId = params.accountId

  const [accountResult, membersResult, timelineResult] = await Promise.all([
    supabaseAdmin
      .from('accounts')
      .select('id, name, slug, plan, is_active, created_at')
      .eq('id', accountId)
      .maybeSingle(),
    supabaseAdmin
      .from('account_members')
      .select('id, account_id, user_id, role, status, created_at')
      .eq('account_id', accountId)
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('admin_logs')
      .select('id, actor_id, action, payload, created_at')
      .or(`target_id.eq.${accountId},payload->>account_id.eq.${accountId}`)
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  if (accountResult.error) {
    return NextResponse.json({ error: accountResult.error.message }, { status: 500 })
  }

  if (!accountResult.data) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const members = await enrichMembers(membersResult.data || [])

  return NextResponse.json({
    account: accountResult.data,
    members,
    timeline: (timelineResult.data || []).map((entry) => ({
      ...entry,
      payload: entry.payload || {}
    }))
  })
}

export async function PATCH(request, ctx) {
  const params = await ctx.params
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user || !isPlatformAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const accountId = params.accountId
  const payload = await request.json().catch(() => null)
  const { memberId, role, profile } = payload || {}

  if (!memberId) {
    return NextResponse.json({ error: 'Missing memberId' }, { status: 400 })
  }

  const { data: existingMember, error: fetchError } = await supabaseAdmin
    .from('account_members')
    .select('id, user_id, role, status, created_at')
    .eq('id', memberId)
    .eq('account_id', accountId)
    .maybeSingle()

  if (fetchError || !existingMember) {
    return NextResponse.json({ error: fetchError?.message || 'Member not found' }, { status: 404 })
  }

  let updatedMember = existingMember

  if (role && ['owner', 'admin', 'member'].includes(role)) {
    const { data, error } = await supabaseAdmin
      .from('account_members')
      .update({ role })
      .eq('id', memberId)
      .eq('account_id', accountId)
      .select('id, user_id, role, status, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    updatedMember = data

    await writeAdminLog({
      actorId: user.id,
      action: 'account_members.role_update',
      targetId: accountId,
      payload: { memberId, role }
    })
  }

  if (profile) {
    const profileUpdates = {}
    if (profile.displayName !== undefined) {
      profileUpdates.display_name = profile.displayName?.trim() || null
    }
    if (profile.phone !== undefined) {
      profileUpdates.phone = profile.phone?.trim() || null
    }

    if (Object.keys(profileUpdates).length) {
      const { data: userResult, error: userError } = await supabaseAdmin.auth.admin.getUserById(updatedMember.user_id)
      if (userError || !userResult?.user) {
        return NextResponse.json({ error: userError?.message || 'User not found' }, { status: 400 })
      }

      const mergedMetadata = {
        ...(userResult.user.user_metadata || {}),
        ...profileUpdates
      }

      const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(updatedMember.user_id, {
        user_metadata: mergedMetadata
      })

      if (updateUserError) {
        return NextResponse.json({ error: updateUserError.message }, { status: 500 })
      }

      await writeAdminLog({
        actorId: user.id,
        action: 'account_members.profile_update',
        targetId: accountId,
        payload: { memberId, profile: profileUpdates }
      })
    }
  }

  const [member] = await enrichMembers([updatedMember])

  return NextResponse.json({ member })
}

export async function POST(request, ctx) {
  const params = await ctx.params
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user || !isPlatformAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const accountId = params.accountId
  const payload = await request.json().catch(() => null)
  const { memberId, action, email, role = 'member' } = payload || {}

  if (memberId && action === 'resend_invite') {
    const { data, error } = await supabaseAdmin
      .from('account_members')
      .select('id, user_id')
      .eq('id', memberId)
      .eq('account_id', accountId)
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Member not found' }, { status: 404 })
    }

    const { data: userLookup, error: userLookupError } = await supabaseAdmin.auth.admin.getUserById(data.user_id)
    if (userLookupError || !userLookup?.user?.email) {
      return NextResponse.json({ error: userLookupError?.message || 'Unable to find user email' }, { status: 400 })
    }

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(userLookup.user.email)
    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 })
    }

    await writeAdminLog({
      actorId: user.id,
      action: 'account_members.resend_invite',
      targetId: accountId,
      payload: { memberId, email: userLookup.user.email }
    })

    return NextResponse.json({ ok: true })
  }

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  }

  const safeRole = ['owner', 'admin', 'member'].includes(role) ? role : 'member'
  const normalizedEmail = email.trim().toLowerCase()

  let memberUser = null
  try {
    console.log(normalizedEmail)
    memberUser = await findUserByEmail(normalizedEmail)
    console.log('Found user by email:', memberUser ?? 'not found')
  } catch (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 400 })
  }

  if (!memberUser) {
    const {
      data: newUser,
      error: createError
    } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: randomUUID(),
      email_confirm: false,
      user_metadata: {
        account_id: accountId
      }
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }
    memberUser = newUser.user
  }

  const { data, error } = await supabaseAdmin
    .from('account_members')
    .insert({
      account_id: accountId,
      user_id: memberUser.id,
      role: safeRole,
      status: 'pending'
    })
    .select('id, user_id, role, status, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let inviteLink = null
  try {
    inviteLink = await generateMagicLink(memberUser.email)
  } catch (linkError) {
    console.error('Failed to generate invite link', linkError)
  }

  await writeAdminLog({
    actorId: user.id,
    action: 'account_members.create',
    targetId: accountId,
    payload: { memberId: data.id, email: memberUser.email, role: safeRole, inviteLink }
  })

  const [member] = await enrichMembers([data])

  return NextResponse.json({ member, inviteLink })
}

export async function DELETE(request, ctx) {
  const params = await ctx.params
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user || !isPlatformAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const accountId = params.accountId
  const payload = await request.json().catch(() => null)
  const { memberId, action } = payload || {}

  if (!memberId || !['cancel_invite', 'remove_member', 'accept_invite'].includes(action)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('account_members')
    .select('id, status, user_id')
    .eq('id', memberId)
    .eq('account_id', accountId)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Member not found' }, { status: 404 })
  }

  if (action === 'cancel_invite' && data.status !== 'pending') {
    return NextResponse.json({ error: 'Só podes cancelar convites pendentes.' }, { status: 400 })
  }

  if (action === 'accept_invite') {
    if (data.status === 'accepted') {
      return NextResponse.json({ error: 'Membro já está ativo.' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('account_members')
      .update({ status: 'accepted' })
      .eq('id', memberId)
      .eq('account_id', accountId)
      .select('id, user_id, role, status, created_at')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    await writeAdminLog({
      actorId: user.id,
      action: 'account_members.accept_invite',
      targetId: accountId,
      payload: { memberId }
    })

    const [member] = await enrichMembers([updated])
    return NextResponse.json({ member, accepted: true })
  }

  const { error: deleteError } = await supabaseAdmin
    .from('account_members')
    .delete()
    .eq('id', memberId)
    .eq('account_id', accountId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  await writeAdminLog({
    actorId: user.id,
    action: action === 'cancel_invite' ? 'account_members.cancel_invite' : 'account_members.remove',
    targetId: accountId,
    payload: { memberId }
  })

  return NextResponse.json({ deleted: true })
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

async function enrichMembers(members) {
  return Promise.all(
    members.map(async (member) => {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(member.user_id)
        return {
          ...member,
          email: error ? '' : data.user?.email || '',
          displayName: error ? '' : data.user?.user_metadata?.display_name || '',
          phone: error ? '' : data.user?.user_metadata?.phone || ''
        }
      } catch {
        return member
      }
    })
  )
}

async function generateMagicLink(email) {
  if (!email) return null
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email
  })

  if (error) {
    throw new Error(error.message)
  }

  return data?.properties?.action_link || null
}
