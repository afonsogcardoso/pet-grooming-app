import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { getPublicAccountBySlug } from '@/lib/publicAccounts'
import PortalLanding from '@/components/portal/PortalLanding'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const account = await getPublicAccountBySlug(slug?.toLowerCase())

  if (!account) {
    return {
      title: 'Booking',
      description: 'Agende online com facilidade.'
    }
  }

  const title = `${account.name} · Marcação online`
  const description = `Reserve serviços em ${account.name}.`
  const image = account.portal_image_url || account.logo_url || '/brand-logo.png'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: image ? [image] : undefined
    }
  }
}

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
