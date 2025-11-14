import { notFound } from 'next/navigation'
import TenantLoginForm from '@/components/tenant/TenantLoginForm'
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

export default async function TenantLoginPage({ params }) {
  const slug = params?.slug?.toLowerCase()
  const account = await getPublicAccountBySlug(slug)

  if (!account) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: account.brand_background || '#fdfcf9' }}>
      <div className="flex-1 grid md:grid-cols-5">
        <div className="hidden md:block md:col-span-3 relative">
          <div className="absolute inset-0" style={gradientStyle(account)} />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
            <div>
              <p className="text-sm uppercase tracking-widest text-white/70">Portal booking</p>
              <h1 className="text-4xl font-bold mt-2">{account.name}</h1>
              <p className="mt-4 text-lg text-white/90 max-w-lg">
                Entra no portal para gerir agendamentos, clientes e branding desta unidade. Este login
                é exclusivo para a equipa de {account.name}.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {account.logo_url && (
                  <img
                    src={account.logo_url}
                    alt={`${account.name} logo`}
                    className="h-16 w-16 rounded-full border-2 border-white/60 object-cover bg-white/20"
                  />
                )}
                <div>
                  <p className="text-sm uppercase tracking-widest text-white/70">Slug</p>
                  <p className="text-2xl font-semibold">{account.slug}</p>
                </div>
              </div>
              <p className="text-sm text-white/70">
                Precisas de ajuda? envia email para{' '}
                <a href="mailto:support@pet-grooming.app" className="underline font-semibold">
                  support@pet-grooming.app
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex items-center justify-center px-6 py-12">
          <TenantLoginForm account={account} />
        </div>
      </div>
    </div>
  )
}
