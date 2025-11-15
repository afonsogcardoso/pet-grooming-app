import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import AdminSidebar from './components/AdminSidebar'

const NAV_ITEMS = [
  {
    label: 'Overview',
    description: 'Health & quick stats',
    icon: '📊',
    href: '/admin'
  },
  {
    label: 'Accounts',
    description: 'Tenants & plans',
    icon: '🏢',
    href: '/admin/accounts'
  },
  {
    label: 'Users',
    description: 'Global directory',
    icon: '👥',
    href: '/admin/users'
  },
  {
    label: 'Domains',
    description: 'Custom hostnames',
    icon: '🌐',
    href: '/admin/domains'
  },
  {
    label: 'Logs',
    description: 'Audit trail',
    icon: '📜',
    href: '/admin/logs'
  }
]

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { user }
  } = await supabase.auth.getUser()

  const lastSignIn = user?.last_sign_in_at ? new Date(user.last_sign_in_at) : null

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="md:flex min-h-screen">
        <AdminSidebar navItems={NAV_ITEMS} />
        <div className="flex-1 flex flex-col bg-slate-50">
          <header className="border-b border-slate-200 bg-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-6 lg:px-10 py-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Signed in as</p>
                <p className="text-lg font-semibold text-slate-900">{user?.email ?? 'platform_admin'}</p>
                <p className="text-sm text-slate-500">
                  Role: <span className="font-medium text-slate-700">Platform admin</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <StatusBadge label="Admin portal" value="Protected" tone="emerald" />
                {lastSignIn && (
                  <StatusBadge
                    label="Last login"
                    value={Intl.DateTimeFormat('pt-PT', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    }).format(lastSignIn)}
                  />
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 px-6 lg:px-10 py-8">{children}</main>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ label, value, tone = 'slate' }) {
  const palette = {
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    slate: 'bg-slate-100 text-slate-600 border border-slate-200'
  }

  return (
    <div className={`rounded-full px-4 py-1.5 text-xs font-semibold ${palette[tone] ?? palette.slate}`}>
      <span className="uppercase tracking-wide">{label}</span>
      <span className="mx-1 text-slate-400">•</span>
      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  )
}
