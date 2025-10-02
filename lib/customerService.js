// ============================================
// FILE: lib/customerService.js
// Customer and Pet database operations
// ============================================

import { supabase } from './supabase'

// ==================== CUSTOMERS ====================

/**
 * Load all customers
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function loadCustomers() {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })

    return { data: data || [], error }
}

/**
 * Load customer summary with counts
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function loadCustomerSummary() {
    const { data, error } = await supabase
        .from('customer_summary')
        .select('*')
        .order('name', { ascending: true })

    return { data: data || [], error }
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
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .order('name', { ascending: true })

    return { data: data || [], error }
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
    const { data, error } = await supabase
        .from('pets')
        .insert([petData])
        .select()

    return { data: data || [], error }
}

/**
 * Update a pet
 * @param {string} id - Pet ID
 * @param {Object} petData - Updated pet data
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function updatePet(id, petData) {
    const { data, error } = await supabase
        .from('pets')
        .update(petData)
        .eq('id', id)
        .select()

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
            pets (name)
        `)
        .eq('customer_id', customerId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })

    return { data: data || [], error }
}
