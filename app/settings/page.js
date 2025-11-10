'use client'

// ============================================
// FILE: app/settings/page.js
// Account branding + member management
// ============================================

import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAccount } from '@/components/AccountProvider'
import { useTranslation } from '@/components/TranslationProvider'

const ROLE_OPTIONS = [
  { value: 'owner', labelKey: 'settings.members.roles.owner' },
  { value: 'admin', labelKey: 'settings.members.roles.admin' },
  { value: 'member', labelKey: 'settings.members.roles.member' }
]

export default function SettingsPage() {
  const { account, membership, authenticated } = useAccount()
  const { t } = useTranslation()
  const [branding, setBranding] = useState({
    logo_url: '',
    brand_primary: '',
    brand_primary_soft: '',
    brand_accent: '',
    brand_accent_soft: '',
    brand_background: '',
    brand_gradient: ''
  })
  const [brandingSaving, setBrandingSaving] = useState(false)
  const [brandingMessage, setBrandingMessage] = useState(null)
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState(null)
  const [inviteForm, setInviteForm] = useState({ email: '', password: '', role: 'member' })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMessage, setInviteMessage] = useState(null)

  const canEdit = useMemo(() => {
    if (!membership) return false
    return ['owner', 'admin'].includes(membership.role)
  }, [membership])

  useEffect(() => {
    if (account) {
      setBranding({
        logo_url: account.logo_url || '',
        brand_primary: account.brand_primary || '',
        brand_primary_soft: account.brand_primary_soft || '',
        brand_accent: account.brand_accent || '',
        brand_accent_soft: account.brand_accent_soft || '',
        brand_background: account.brand_background || '',
        brand_gradient: account.brand_gradient || ''
      })
    }
  }, [account])

  const loadMembers = useCallback(async () => {
    if (!account?.id) return
    setMembersLoading(true)
    setMembersError(null)
    const {
      data: { session }
    } = await supabase.auth.getSession()
    const token = session?.access_token
    const response = await fetch(`/api/account/members?accountId=${account.id}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setMembersError(body.error || 'Request failed')
      setMembersLoading(false)
      return
    }

    const body = await response.json()
    setMembers(body.members || [])
    setMembersLoading(false)
  }, [account?.id])

  useEffect(() => {
    if (canEdit) {
      loadMembers()
    }
  }, [canEdit, loadMembers])

  if (!authenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600">{t('settings.auth.required')}</p>
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="bg-white shadow rounded-2xl p-6 border border-yellow-200">
        <p className="text-lg font-semibold text-yellow-800">{t('settings.auth.noAccess')}</p>
        <p className="text-gray-600 mt-2">{t('settings.auth.hint')}</p>
      </div>
    )
  }

  const handleBrandingSubmit = async (event) => {
    event.preventDefault()
    if (!account?.id) return
    setBrandingSaving(true)
    setBrandingMessage(null)

    const { error } = await supabase
      .from('accounts')
      .update({
        logo_url: branding.logo_url,
        brand_primary: branding.brand_primary,
        brand_primary_soft: branding.brand_primary_soft,
        brand_accent: branding.brand_accent,
        brand_accent_soft: branding.brand_accent_soft,
        brand_background: branding.brand_background,
        brand_gradient: branding.brand_gradient
      })
      .eq('id', account.id)

    if (error) {
      setBrandingMessage({
        type: 'error',
        text: error.message
      })
    } else {
      setBrandingMessage({
        type: 'success',
        text: t('settings.branding.success')
      })
    }

    setBrandingSaving(false)
  }

  const handleInviteSubmit = async (event) => {
    event.preventDefault()
    if (!account?.id) return
    setInviteLoading(true)
    setInviteMessage(null)

    const {
      data: { session }
    } = await supabase.auth.getSession()
    const token = session?.access_token

    const response = await fetch('/api/account/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        accountId: account.id,
        email: inviteForm.email,
        password: inviteForm.password || undefined,
        role: inviteForm.role
      })
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      setInviteMessage({
        type: 'error',
        text: body.error || 'Request failed'
      })
      setInviteLoading(false)
      return
    }

    setInviteMessage({
      type: 'success',
      text: t('settings.members.inviteSuccess')
    })
    setInviteForm({ email: '', password: '', role: 'member' })
    setInviteLoading(false)
    loadMembers()
  }

  return (
    <div className="space-y-8">
      <section className="bg-white shadow rounded-2xl p-6 border border-gray-100">
        <div className="flex flex-col gap-2 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t('settings.branding.title')}</h2>
          <p className="text-gray-600">{t('settings.branding.description')}</p>
        </div>

        <form onSubmit={handleBrandingSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            {t('settings.branding.fields.logo')}
            <input
              type="url"
              value={branding.logo_url}
              onChange={(e) => setBranding((prev) => ({ ...prev, logo_url: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-gray-900"
              placeholder="https://..."
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            {t('settings.branding.fields.primary')}
            <input
              type="color"
              value={branding.brand_primary || '#4fafa9'}
              onChange={(e) => setBranding((prev) => ({ ...prev, brand_primary: e.target.value }))}
              className="w-full h-12 border-2 border-gray-200 rounded-lg"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            {t('settings.branding.fields.primarySoft')}
            <input
              type="color"
              value={branding.brand_primary_soft || '#e7f8f7'}
              onChange={(e) =>
                setBranding((prev) => ({ ...prev, brand_primary_soft: e.target.value }))
              }
              className="w-full h-12 border-2 border-gray-200 rounded-lg"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            {t('settings.branding.fields.accent')}
            <input
              type="color"
              value={branding.brand_accent || '#f4d58d'}
              onChange={(e) => setBranding((prev) => ({ ...prev, brand_accent: e.target.value }))}
              className="w-full h-12 border-2 border-gray-200 rounded-lg"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            {t('settings.branding.fields.accentSoft')}
            <input
              type="color"
              value={branding.brand_accent_soft || '#fdf6de'}
              onChange={(e) =>
                setBranding((prev) => ({ ...prev, brand_accent_soft: e.target.value }))
              }
              className="w-full h-12 border-2 border-gray-200 rounded-lg"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            {t('settings.branding.fields.background')}
            <input
              type="color"
              value={branding.brand_background || '#fdfcf9'}
              onChange={(e) =>
                setBranding((prev) => ({ ...prev, brand_background: e.target.value }))
              }
              className="w-full h-12 border-2 border-gray-200 rounded-lg"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 md:col-span-2">
            {t('settings.branding.fields.gradient')}
            <input
              type="text"
              value={branding.brand_gradient}
              onChange={(e) =>
                setBranding((prev) => ({ ...prev, brand_gradient: e.target.value }))
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-gray-900"
              placeholder="linear-gradient(...)"
            />
          </label>

          <div className="md:col-span-2 flex flex-wrap gap-3 items-center">
            <button
              type="submit"
              disabled={brandingSaving}
              className="btn-brand px-6 py-3 shadow-brand-glow disabled:opacity-60"
            >
              {brandingSaving ? t('settings.branding.saving') : t('settings.branding.save')}
            </button>
            {brandingMessage && (
              <span
                className={`text-sm ${
                  brandingMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {brandingMessage.text}
              </span>
            )}
          </div>
        </form>
      </section>

      <section className="bg-white shadow rounded-2xl p-6 border border-gray-100">
        <div className="flex flex-col gap-2 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t('settings.members.title')}</h2>
          <p className="text-gray-600">{t('settings.members.description')}</p>
        </div>

        <form onSubmit={handleInviteSubmit} className="grid gap-4 md:grid-cols-3 mb-8">
          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 md:col-span-1">
            {t('settings.members.fields.email')}
            <input
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-gray-900"
              placeholder="teammate@example.com"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 md:col-span-1">
            {t('settings.members.fields.password')}
            <input
              type="text"
              value={inviteForm.password}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-gray-900"
              placeholder={t('settings.members.fields.passwordPlaceholder')}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 md:col-span-1">
            {t('settings.members.fields.role')}
            <select
              value={inviteForm.role}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-gray-900"
            >
              {ROLE_OPTIONS.map(({ value, labelKey }) => (
                <option key={value} value={value}>
                  {t(labelKey)}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-3 flex flex-wrap gap-3 items-center">
            <button
              type="submit"
              disabled={inviteLoading}
              className="btn-brand px-6 py-3 shadow-brand-glow disabled:opacity-60"
            >
              {inviteLoading ? t('settings.members.inviting') : t('settings.members.invite')}
            </button>
            {inviteMessage && (
              <span
                className={`text-sm ${
                  inviteMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {inviteMessage.text}
              </span>
            )}
          </div>
        </form>

        <div className="space-y-3">
          {membersLoading && <p className="text-gray-500">{t('settings.members.loading')}</p>}
          {membersError && <p className="text-rose-600 text-sm">{membersError}</p>}
          {!membersLoading && members.length === 0 && (
            <p className="text-gray-600">{t('settings.members.empty')}</p>
          )}
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between border border-gray-200 rounded-xl px-4 py-3"
            >
              <div>
                <p className="font-semibold text-gray-900">{member.email || member.user_id}</p>
                <p className="text-sm text-gray-600">{t(`settings.members.roles.${member.role}`)}</p>
              </div>
              <span
                className={`mt-2 sm:mt-0 px-3 py-1 rounded-full text-xs font-semibold ${
                  member.status === 'accepted'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {member.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
