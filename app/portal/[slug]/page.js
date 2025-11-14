import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicAccountBySlug } from '@/lib/publicAccounts'

export const dynamic = 'force-dynamic'

function gradientStyle(account) {
  if (account?.brand_gradient) {
    return { backgroundImage: account.brand_gradient }
  }
  if (account?.brand_primary && account?.brand_accent) {
    return {
      backgroundImage: `linear-gradient(135deg, ${account.brand_primary}, ${account.brand_accent})`
    }
  }
  return {
    backgroundImage: 'linear-gradient(135deg, #4fafa9, #7a5af8)'
  }
}

export default async function BookingLandingPage({ params }) {
  const slugParam = params?.slug?.toLowerCase()
  const account = await getPublicAccountBySlug(slugParam)

  if (!account) {
    notFound()
  }

  const primary = account.brand_primary || '#4fafa9'
  const accent = account.brand_accent || '#f4d58d'
  const background = account.brand_background || '#fdfcf9'

  return (
    <div className="min-h-screen" style={{ backgroundColor: background }}>
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10" style={gradientStyle(account)} />
        <div className="max-w-5xl mx-auto px-6 py-16 text-white">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              {account.logo_url && (
                <img
                  src={account.logo_url}
                  alt={`${account.name} logo`}
                  className="h-16 w-16 rounded-full border-2 border-white/60 object-cover bg-white/20"
                />
              )}
              <div>
                <p className="text-sm uppercase tracking-widest text-white/80">Booking portal</p>
                <h1 className="text-4xl md:text-5xl font-bold">{account.name}</h1>
              </div>
            </div>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl">
              Reserva grooming, banho e serviços especiais com a equipa de {account.name}. Escolhe o
              melhor horário e acompanha o estado do teu agendamento num portal personalizado.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/portal/${account.slug}/login`}
                className="btn-brand px-8 py-3 text-lg font-semibold"
                style={{
                  backgroundColor: primary,
                  borderColor: primary,
                  color: '#fff',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.15)'
                }}
              >
                Entrar / Reservar
              </Link>
              <a
                href="mailto:contact@pet-grooming.app"
                className="px-8 py-3 rounded-full border-2 font-semibold text-white hover:bg-white/10"
              >
                Falar com a equipa
              </a>
            </div>
          </div>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: 'Equipe dedicada',
              text: 'Profissionais certificados que conhecem o teu pet.'
            },
            {
              title: 'Horários flexíveis',
              text: 'Agenda em minutos a partir de qualquer dispositivo.'
            },
            {
              title: 'Atualizações em tempo real',
              text: 'Recebe confirmações e lembretes por email ou SMS.'
            }
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2" style={{ color: primary }}>
                {item.title}
              </h3>
              <p className="text-gray-600">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: account.brand_primary_soft || '#e7f8f7', color: primary }}>
            🔐 Portal seguro • {account.name}
          </span>
        </div>
      </section>
    </div>
  )
}
