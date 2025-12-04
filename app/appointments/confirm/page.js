import { headers } from 'next/headers'
import ConfirmationPage from '@/components/ConfirmationPage'
import { getPublicAccountBySlug } from '@/lib/publicAccounts'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function buildAbsoluteUrl(path) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  if (!path) return null
  if (path.startsWith('http')) return path
  if (siteUrl) {
    return `${siteUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
  }
  return path
}

async function resolveAccount(slugFromQuery) {
  const headerList = headers()
  const slugFromHeader = headerList.get('x-account-slug')

  const slug = slugFromHeader || slugFromQuery
  if (!slug) return null

  try {
    return await getPublicAccountBySlug(slug)
  } catch (error) {
    console.error('Failed to load account for confirmation page', error)
    return null
  }
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams
  const slugFromQuery = params?.slug || params?.s || params?.workspace || null
  const account = await resolveAccount(slugFromQuery)

  const title = 'Confirmação de reserva'
  const description = 'Veja os detalhes da sua marcação.'

  const ogCandidate = account?.portal_image_url || account?.logo_url || null
  const ogImage = buildAbsoluteUrl(ogCandidate)

  return {
    title,
    description,
    openGraph: { title, description, images: ogImage ? [ogImage] : undefined },
    twitter: { card: 'summary', title, description, images: ogImage ? [ogImage] : undefined }
  }
}

export default function AppointmentConfirmationPage() {
  return <ConfirmationPage />
}
