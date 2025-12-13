import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import AccountManageClient from './AccountManageClient'

export const dynamic = 'force-dynamic'

export default async function AccountManagePage({ params }) {
  const accountId = params?.accountId
  const cookieStore = await cookies()
  const token = readAccessToken(cookieStore)
  if (!token) {
    redirect('/admin/login?adminError=no_session')
  }

  const profile = await fetchProfile(token)
  if (!profile?.platformAdmin) {
    redirect('/admin/login?adminError=forbidden')
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

function readAccessToken(cookieStore) {
  const projectRef = getProjectRef()
  const projectCookie = projectRef ? `sb-${projectRef}-auth-token` : null
  const token =
    cookieStore.get('sb-access-token')?.value ||
    (projectCookie ? cookieStore.get(projectCookie)?.value : null)
  return token || null
}

function getProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  try {
    const host = new URL(url).hostname || ''
    const parts = host.split('.')
    return parts[0] || null
  } catch {
    return null
  }
}

async function fetchProfile(token) {
  const base = (process.env.API_BASE_URL || '').replace(/\/$/, '')
  const url = base ? `${base}/api/v1/profile` : '/api/v1/profile'

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}
