// ============================================
// FILE: components/ViewToggle.js
// View toggle buttons component
// ============================================

export default function ViewToggle({ view, onViewChange }) {
    return (
        <div className="flex gap-2">
            <button
                onClick={() => onViewChange('list')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition duration-200 ${view === 'list'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
            >
                📋 List View
            </button>
            <button
                onClick={() => onViewChange('calendar')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition duration-200 ${view === 'calendar'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
            >
                📅 Week View
            </button>
        </div>
    )
}
