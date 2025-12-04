import ConfirmationPage from '@/components/ConfirmationPage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export function generateMetadata() {
  const title = 'Confirmação de reserva'
  const description = 'Veja os detalhes da sua marcação.'
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: 'summary', title, description }
  }
}

export default function AppointmentConfirmationPage() {
  return <ConfirmationPage />
}
