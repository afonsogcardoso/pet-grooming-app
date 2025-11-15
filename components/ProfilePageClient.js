'use client'

import ProfileMetadataForm from '@/components/ProfileMetadataForm'
import ResetPasswordForm from '@/components/ResetPasswordForm'
import { useTranslation } from '@/components/TranslationProvider'

function formatDate(value, locale, options = { dateStyle: 'medium' }) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat(locale, options).format(new Date(value))
  } catch {
    return value
  }
}

export default function ProfilePageClient({ user, memberships = [] }) {
  const { t, resolvedLocale } = useTranslation()

  if (!user) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">{t('profile.page.title')}</h1>
        <p className="text-slate-600">{t('profile.page.requiresAuth')}</p>
      </section>
    )
  }

  const metadataEntries = Object.entries(user.user_metadata || {})
  const appMetadataEntries = Object.entries(user.app_metadata || {})

  return (
    <section className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t('profile.page.sectionLabel')}
        </p>
        <h1 className="text-3xl font-bold text-slate-900">{user.email}</h1>
        <p className="text-sm text-slate-500">
          {t('profile.page.lastLogin', {
            value: user.last_sign_in_at
              ? formatDate(user.last_sign_in_at, resolvedLocale, {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })
              : t('profile.common.notAvailable')
          })}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            {t('profile.basics.title')}
          </h2>
          <dl className="mt-4 space-y-3 text-sm text-slate-600">
            <div>
              <dt className="font-semibold text-slate-500">
                {t('profile.basics.labels.id')}
              </dt>
              <dd className="break-all">{user.id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">
                {t('profile.basics.labels.email')}
              </dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">
                {t('profile.basics.labels.createdAt')}
              </dt>
              <dd>{formatDate(user.created_at, resolvedLocale)}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            {t('profile.metadata.title')}
          </h2>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-500">
                {t('profile.metadata.user')}
              </p>
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
                <p className="mt-2 text-slate-400">{t('profile.metadata.empty')}</p>
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-500">
                {t('profile.metadata.app')}
              </p>
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
                <p className="mt-2 text-slate-400">{t('profile.metadata.empty')}</p>
              )}
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          {t('profile.editSection.title')}
        </h2>
        <p className="text-sm text-slate-500">{t('profile.editSection.description')}</p>
        <div className="mt-4">
          <ProfileMetadataForm
            initialDisplayName={user.user_metadata?.display_name || ''}
            initialPhone={user.user_metadata?.phone || ''}
            initialLocale={user.user_metadata?.preferred_locale || 'pt'}
          />
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          {t('profile.passwordSection.title')}
        </h2>
        <p className="text-sm text-slate-500">{t('profile.passwordSection.description')}</p>
        <div className="mt-4">
          <ResetPasswordForm />
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          {t('profile.memberships.title')}
        </h2>
        {!memberships?.length ? (
          <p className="text-sm text-slate-500">{t('profile.memberships.empty')}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t('profile.memberships.headers.account')}</th>
                  <th className="px-4 py-3">{t('profile.memberships.headers.role')}</th>
                  <th className="px-4 py-3">{t('profile.memberships.headers.status')}</th>
                  <th className="px-4 py-3">{t('profile.memberships.headers.since')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {memberships.map((entry) => (
                  <tr key={`${entry.account_id}-${entry.role}`}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {entry.account?.name || t('profile.memberships.fallbackAccount')}
                      </div>
                      <div className="text-xs text-slate-500">
                        {entry.account?.slug || entry.account_id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {t(`profile.memberships.roles.${entry.role}`)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {t(`profile.memberships.status.${entry.status}`)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(entry.created_at, resolvedLocale)}
                    </td>
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
