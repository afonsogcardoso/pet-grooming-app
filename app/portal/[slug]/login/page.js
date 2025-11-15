import { notFound } from 'next/navigation'
import { getPublicAccountBySlug } from '@/lib/publicAccounts'
import PortalLoginLayout from '@/components/portal/PortalLoginLayout'

export const dynamic = 'force-dynamic'

export default async function TenantLoginPage({ params }) {
  const { slug: rawSlug } = await params
  const slug = rawSlug?.toLowerCase()
  const account = await getPublicAccountBySlug(slug)

  if (!account) {
    notFound()
  }

  return <PortalLoginLayout account={account} />
}
