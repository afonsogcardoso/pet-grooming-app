import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { getPublicAccountBySlug } from '@/lib/publicAccounts'
import PortalLanding from '@/components/portal/PortalLanding'

export const dynamic = 'force-dynamic'

export default async function BookingLandingPage({ params }) {
  const { slug } = await params
  const slugParam = slug?.toLowerCase()
  const account = await getPublicAccountBySlug(slugParam)

  if (!account) {
    notFound()
  }
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  const {
    data: { session }
  } = await supabase.auth.getSession()

  return <PortalLanding account={account} isAuthenticated={!!session} />
}
