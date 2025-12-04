import ConfirmationPage from '@/components/ConfirmationPage'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const APPOINTMENT_CONFIRM_SELECT = `
  id,
  appointment_date,
  appointment_time,
  duration,
  notes,
  status,
  payment_status,
  account_id,
  public_token,
  customers ( id, name, phone, address ),
  pets ( id, name, breed ),
  services ( id, name ),
  accounts:accounts ( id, name, slug, portal_image_url, logo_url )
`

function buildAbsoluteUrl(path) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  if (!path) return null
  if (path.startsWith('http')) return path
  if (siteUrl) {
    return `${siteUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
  }
  return path
}

async function fetchAppointmentWithToken(id, token) {
  if (!id || !token) return { appointment: null }
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select(APPOINTMENT_CONFIRM_SELECT)
    .eq('id', id)
    .eq('public_token', token)
    .maybeSingle()

  if (error) {
    console.error('Failed to load appointment for confirmation', error)
  }

  return { appointment: data || null }
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams
  const id = params?.id || null
  const token = params?.token || null
  const { appointment } = await fetchAppointmentWithToken(id, token)

  const title = 'Confirmação de reserva'
  const description = 'Veja os detalhes da sua marcação.'

  const ogCandidate =
    appointment?.accounts?.portal_image_url ||
    appointment?.accounts?.logo_url ||
    null
  const ogImage = buildAbsoluteUrl(ogCandidate)

  return {
    title,
    description,
    openGraph: { title, description, images: ogImage ? [ogImage] : undefined },
    twitter: { card: 'summary', title, description, images: ogImage ? [ogImage] : undefined }
  }
}

export default async function AppointmentConfirmationPage({ searchParams }) {
  const params = await searchParams
  const id = params?.id || null
  const token = params?.token || null

  const { appointment } = await fetchAppointmentWithToken(id, token)

  return <ConfirmationPage appointment={appointment} />
}
