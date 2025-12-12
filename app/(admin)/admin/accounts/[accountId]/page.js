import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import AccountManageClient from './AccountManageClient'

export const dynamic = 'force-dynamic'

export default async function AccountManagePage({ params }) {
  const accountId = params?.accountId
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user || !isPlatformAdmin(user)) {
    return <div className="p-6 text-red-700">Forbidden</div>
  }

  const { data: account } = await supabaseAdmin
    .from('accounts')
    .select('id, name, slug, plan, is_active, created_at')
    .eq('id', accountId)
    .maybeSingle()

  if (!account) {
    return <div className="p-6 text-red-700">Account not found.</div>
  }

  return <AccountManageClient account={account} />
}

function isPlatformAdmin(user) {
  const adminList = (process.env.NEXT_PUBLIC_PLATFORM_ADMIN_EMAILS || process.env.PLATFORM_ADMIN_EMAILS || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
  const email = user?.email?.toLowerCase()
  return email && adminList.includes(email)
}
