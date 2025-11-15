import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import ProfileMetadataForm from '@/components/ProfileMetadataForm'
import ResetPasswordForm from '@/components/ResetPasswordForm'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Perfil</h1>
        <p className="text-slate-600">Precisas de iniciar sessão para veres o teu perfil.</p>
      </section>
    )
  }

  const metadataEntries = Object.entries(user.user_metadata || {})
  const appMetadataEntries = Object.entries(user.app_metadata || {})

  const { data: memberships } = await supabase
    .from('account_members')
    .select(
      `
      account_id,
      role,
      status,
      created_at,
      account:accounts (id, name, slug, plan)
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return (
    <section className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Perfil</p>
        <h1 className="text-3xl font-bold text-slate-900">{user.email}</h1>
        <p className="text-sm text-slate-500">
          Último login{' '}
          {user.last_sign_in_at
            ? new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium', timeStyle: 'short' }).format(
                new Date(user.last_sign_in_at)
              )
            : '—'}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Dados básicos</h2>
          <dl className="mt-4 space-y-3 text-sm text-slate-600">
            <div>
              <dt className="font-semibold text-slate-500">ID</dt>
              <dd className="break-all">{user.id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Criado em</dt>
              <dd>
                {user.created_at
                  ? new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium' }).format(new Date(user.created_at))
                  : '—'}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Metadata</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-500">user_metadata</p>
              {metadataEntries.length ? (
                <ul className="mt-2 space-y-1">
                  {metadataEntries.map(([key, value]) => (
                    <li key={key} className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-slate-500">{key}</span>
                      <span className="break-words text-right">{JSON.stringify(value)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-slate-400">Sem metadata.</p>
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-500">app_metadata</p>
              {appMetadataEntries.length ? (
                <ul className="mt-2 space-y-1">
                  {appMetadataEntries.map(([key, value]) => (
                    <li key={key} className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-slate-500">{key}</span>
                      <span className="break-words text-right">{JSON.stringify(value)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-slate-400">Sem metadata.</p>
              )}
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Editar perfil</h2>
        <p className="text-sm text-slate-500">Atualiza o teu nome e telefone para partilhar com a equipa.</p>
        <div className="mt-4">
          <ProfileMetadataForm
            initialDisplayName={user.user_metadata?.display_name || ''}
            initialPhone={user.user_metadata?.phone || ''}
          />
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Password</h2>
        <p className="text-sm text-slate-500">Define uma nova password segura.</p>
        <div className="mt-4">
          <ResetPasswordForm />
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Associações</h2>
        {!memberships?.length ? (
          <p className="text-sm text-slate-500">Este utilizador ainda não pertence a nenhuma conta.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Desde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {memberships.map((entry) => (
                  <tr key={`${entry.account_id}-${entry.role}`}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{entry.account?.name || 'Conta'}</div>
                      <div className="text-xs text-slate-500">{entry.account?.slug || entry.account_id}</div>
                    </td>
                    <td className="px-4 py-3">{entry.role}</td>
                    <td className="px-4 py-3 text-slate-600">{entry.status}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(entry.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  )
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}
