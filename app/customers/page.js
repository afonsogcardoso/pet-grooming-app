// ============================================
// FILE: app/customers/page.js
// Customer management page route
// ============================================
'use client'

import CustomerManager from '@/components/CustomerManager'

export default function CustomersPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <CustomerManager />
            </div>
        </div>
    )
}
