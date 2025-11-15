import { notFound } from 'next/navigation'
import { getPublicAccountBySlug } from '@/lib/publicAccounts'
import PortalLanding from '@/components/portal/PortalLanding'

export const dynamic = 'force-dynamic'

export default async function BookingLandingPage({ params }) {
  const slugParam = params?.slug?.toLowerCase()
  const account = await getPublicAccountBySlug(slugParam)

  if (!account) {
    notFound()
  }

  return <PortalLanding account={account} />
}
