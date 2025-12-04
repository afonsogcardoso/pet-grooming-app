import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const id = body?.id
    const token = body?.token

    if (!id || !token) {
      return NextResponse.json({ ok: false, error: 'missing_parameters' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('appointments')
      .update({ confirmation_opened_at: new Date().toISOString() })
      .eq('id', id)
      .eq('public_token', token)
      .is('confirmation_opened_at', null)

    if (error) {
      console.error('confirm-open update failed', error)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('confirm-open exception', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
