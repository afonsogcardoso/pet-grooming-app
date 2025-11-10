// ============================================
// FILE: components/ViewToggle.js
// View toggle buttons component
// ============================================

'use client'

import { useTranslation } from '@/components/TranslationProvider'

export default function ViewToggle({ view, onViewChange }) {
    const { t } = useTranslation()

    const baseClasses =
        'flex-1 rounded-full font-semibold transition duration-200 border flex items-center justify-center gap-2 py-3 px-4 text-base'
    const activeClasses =
        'bg-[color:var(--brand-primary)] text-white border-[color:var(--brand-primary)] shadow-brand-glow'
    const inactiveClasses =
        'bg-white text-brand-primary border-[color:var(--brand-primary)] hover:bg-brand-primary-soft'

    return (
        <div className="flex gap-2">
            <button
                onClick={() => onViewChange('list')}
                className={`${baseClasses} ${view === 'list' ? activeClasses : inactiveClasses}`}
            >
                📋 {t('viewToggle.list')}
            </button>
            <button
                onClick={() => onViewChange('calendar')}
                className={`${baseClasses} ${view === 'calendar' ? activeClasses : inactiveClasses}`}
            >
                📅 {t('viewToggle.calendar')}
            </button>
        </div>
    )
}
