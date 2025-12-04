import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const { access_token: accessToken, refresh_token: refreshToken } = await request.json()

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ ok: false, error: 'missing_tokens' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  try {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })
  } catch (error) {
    console.error('Failed to set Supabase session', error)
    // Clear any stale cookies to avoid refresh loops
    await supabase.auth.signOut()
    return NextResponse.json(
      { ok: false, error: error?.code || error?.message || 'set_session_failed' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true })
}
