'use client'

import { useState } from 'react'

export default function ProfileMetadataForm({ initialDisplayName = '', initialPhone = '' }) {
  const [form, setForm] = useState({ displayName: initialDisplayName, phone: initialPhone })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(body.error || 'Falha ao atualizar o perfil.')
      }
      setStatus({ type: 'success', text: 'Perfil atualizado.' })
    } catch (error) {
      setStatus({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-semibold text-slate-600">
        Nome a apresentar
        <input
          type="text"
          value={form.displayName}
          onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
          placeholder="Ex.: Maria Silva"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
        />
      </label>
      <label className="block text-sm font-semibold text-slate-600">
        Telefone
        <input
          type="tel"
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          placeholder="(+351) ..."
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
        />
      </label>
      {status && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {status.text}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'A guardar...' : 'Guardar alterações'}
      </button>
    </form>
  )
}
