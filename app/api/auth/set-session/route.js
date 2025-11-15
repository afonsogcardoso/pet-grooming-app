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
  await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  })

  return NextResponse.json({ ok: true })
}
