import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import ProfilePageClient from '@/components/ProfilePageClient'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { user }
  } = await supabase.auth.getUser()

  const { data: memberships } = await supabase
    .from('account_members')
    .select(
      `
      account_id,
      role,
      status,
      created_at,
      account:accounts (id, name, slug, plan)
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return <ProfilePageClient user={user} memberships={memberships || []} />
}
