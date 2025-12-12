import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import ApiKeysClient from './ApiKeysClient'

export const dynamic = 'force-dynamic'

export default async function ApiKeysPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  const {
    data: { user }
  } = await supabase.auth.getUser()

  return <ApiKeysClient currentUserEmail={user?.email || ''} />
}
