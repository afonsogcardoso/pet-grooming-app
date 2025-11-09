// ============================================
// FILE: components/ViewToggle.js
// View toggle buttons component
// ============================================

'use client'

import { useTranslation } from '@/components/TranslationProvider'

export default function ViewToggle({ view, onViewChange }) {
    const { t } = useTranslation()

    return (
        <div className="flex gap-2">
            <button
                onClick={() => onViewChange('list')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition duration-200 ${view === 'list'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
            >
                📋 {t('viewToggle.list')}
            </button>
            <button
                onClick={() => onViewChange('calendar')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition duration-200 ${view === 'calendar'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
            >
                📅 {t('viewToggle.calendar')}
            </button>
        </div>
    )
}
