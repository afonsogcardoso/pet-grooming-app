// ============================================
// FILE: lib/customerService.js
// Customer and Pet database operations
// ============================================

import { supabase } from './supabase'

// ==================== CUSTOMERS ====================

/**
 * Load all customers with pet and appointment counts
 * @returns {Promise<Object>} Object with data and error properties
 */
async function fetchCustomersWithRelations() {
    const { data, error } = await supabase
        .from('customers')
        .select(`
            *,
            pets (id, name),
            appointments (id)
        `)
        .order('name', { ascending: true })

    return { data: data || [], error }
}

export async function loadCustomers() {
    const { data, error } = await fetchCustomersWithRelations()

    const customersWithCounts = data.map((customer) => ({
        ...customer,
        pet_count: customer.pets ? customer.pets.length : 0,
        appointment_count: customer.appointments ? customer.appointments.length : 0,
        pets: undefined,
        appointments: undefined
    }))

    return { data: customersWithCounts, error }
}

/**
 * Get a single customer by ID
 * @param {string} id - Customer ID
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function getCustomer(id) {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

    return { data, error }
}

/**
 * Create a new customer
 * @param {Object} customerData - Customer data to insert
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function createCustomer(customerData) {
    const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()

    return { data: data || [], error }
}

/**
 * Update a customer
 * @param {string} id - Customer ID
 * @param {Object} customerData - Updated customer data
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function updateCustomer(id, customerData) {
    // Just update and return basic customer data
    const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', id)
        .select()

    return { data, error }
}

/**
 * Delete a customer
 * @param {string} id - Customer ID to delete
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function deleteCustomer(id) {
    const { data, error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

    return { data, error }
}

/**
 * Search customers by name or phone
 * @param {string} searchTerm - Search term
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function searchCustomers(searchTerm) {
    const term = searchTerm?.trim()
    if (!term) {
        return loadCustomers()
    }

    const lowerTerm = term.toLowerCase()
    const { data, error } = await fetchCustomersWithRelations()

    if (error) {
        return { data: [], error }
    }

    const filtered = data.filter((customer) => {
        const matchesField = [
            customer.name,
            customer.phone,
            customer.email,
            customer.address,
            customer.notes
        ].some((value) => value?.toLowerCase().includes(lowerTerm))

        const matchesPet = customer.pets?.some((pet) =>
            pet.name?.toLowerCase().includes(lowerTerm)
        )

        return matchesField || matchesPet
    })

    const customersWithCounts = filtered.map((customer) => ({
        ...customer,
        pet_count: customer.pets ? customer.pets.length : 0,
        appointment_count: customer.appointments ? customer.appointments.length : 0,
        pets: undefined,
        appointments: undefined
    }))

    return { data: customersWithCounts, error: null }
}

// ==================== PETS ====================

/**
 * Load all pets for a customer
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function loadPetsByCustomer(customerId) {
    const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('customer_id', customerId)
        .order('name', { ascending: true })

    return { data: data || [], error }
}

/**
 * Get a single pet by ID
 * @param {string} id - Pet ID
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function getPet(id) {
    const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', id)
        .single()

    return { data, error }
}

/**
 * Create a new pet
 * @param {Object} petData - Pet data to insert
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function createPet(petData) {
    const { data, error } = await supabase.from('pets').insert([petData]).select()
    return { data: data || [], error }
}

/**
 * Update a pet
 * @param {string} id - Pet ID
 * @param {Object} petData - Updated pet data
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function updatePet(id, petData) {
    const { data, error } = await supabase.from('pets').update(petData).eq('id', id).select()
    return { data, error }
}

/**
 * Delete a pet
 * @param {string} id - Pet ID to delete
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function deletePet(id) {
    const { data, error } = await supabase
        .from('pets')
        .delete()
        .eq('id', id)

    return { data, error }
}

// ==================== APPOINTMENTS WITH CUSTOMER/PET ====================

/**
 * Load appointments for a specific customer
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function loadCustomerAppointments(customerId) {
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            customers (name, phone),
            pets (name),
            services (name)
        `)
        .eq('customer_id', customerId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })

    return { data: data || [], error }
}
