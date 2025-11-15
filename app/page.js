import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = 'force-dynamic'

export default async function RootRedirect() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const user = session.user
  let targetSlug =
    user?.user_metadata?.account?.slug ||
    user?.app_metadata?.account?.slug ||
    null

  if (!targetSlug) {
    const { data } = await supabase
      .from('account_members')
      .select('account:accounts (slug)')
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: true })
      .limit(1)

    targetSlug = data?.[0]?.account?.slug || null
  }

  if (!targetSlug) {
    redirect('/login')
  }

  redirect(`/portal/${targetSlug}`)
}
