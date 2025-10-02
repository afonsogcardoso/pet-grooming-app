// ============================================
// FILE: components/FilterButtons.js
// Filter button row component
// ============================================

export default function FilterButtons({ filter, onFilterChange }) {
    const filters = [
        { value: 'all', label: 'All', color: 'gray' },
        { value: 'upcoming', label: 'Upcoming', color: 'blue' },
        { value: 'completed', label: 'Completed', color: 'green' }
    ]

    const getColorClasses = (filterValue, color) => {
        if (filter === filterValue) {
            return `bg-${color}-500 text-white shadow-lg`
        }
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }

    return (
        <div className="grid grid-cols-3 gap-2">
            {filters.map(({ value, label, color }) => (
                <button
                    key={value}
                    onClick={() => onFilterChange(value)}
                    className={`py-3 px-4 rounded-lg font-semibold transition duration-200 ${getColorClasses(value, color)}`}
                >
                    {label}
                </button>
            ))}
        </div>
    )
}
