import { notFound } from 'next/navigation'
import { getPublicAccountBySlug } from '@/lib/publicAccounts'
import PortalLoginLayout from '@/components/portal/PortalLoginLayout'

export const dynamic = 'force-dynamic'

export default async function TenantLoginPage({ params }) {
  const slug = params?.slug?.toLowerCase()
  const account = await getPublicAccountBySlug(slug)

  if (!account) {
    notFound()
  }

  return <PortalLoginLayout account={account} />
}
