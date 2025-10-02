// ============================================
// FILE: lib/appointmentService.js
// Database operations for appointments
// ============================================

import { supabase } from './supabase'

/**
 * Load all appointments from the database with customer data
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function loadAppointments() {
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            customers (
                name,
                phone,
                address
            ),
            pets (
                name
            )
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

    return { data: data || [], error }
}

/**
 * Create a new appointment
 * @param {Object} appointmentData - Appointment data to insert
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function createAppointment(appointmentData) {
    const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()

    return { data: data || [], error }
}

/**
 * Update an appointment's status
 * @param {string} id - Appointment ID
 * @param {string} status - New status value
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function updateAppointmentStatus(id, status) {
    const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .select()

    return { data, error }
}

/**
 * Update an appointment's data
 * @param {string} id - Appointment ID
 * @param {Object} appointmentData - Updated appointment data
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function updateAppointment(id, appointmentData) {
    const { data, error } = await supabase
        .from('appointments')
        .update(appointmentData)
        .eq('id', id)
        .select()

    return { data, error }
}

/**
 * Delete an appointment
 * @param {string} id - Appointment ID to delete
 * @returns {Promise<Object>} Object with data and error properties
 */
export async function deleteAppointment(id) {
    const { data, error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

    return { data, error }
}

/**
 * Filter appointments based on criteria
 * @param {Object[]} appointments - Array of appointments to filter
 * @param {string} filter - Filter type: 'all', 'upcoming', 'completed'
 * @returns {Object[]} Filtered appointments
 */
export function filterAppointments(appointments, filter) {
    const today = new Date().toISOString().split('T')[0]

    switch (filter) {
        case 'upcoming':
            return appointments.filter(apt =>
                apt.status !== 'completed' && apt.appointment_date >= today
            )
        case 'completed':
            return appointments.filter(apt => apt.status === 'completed')
        default:
            return appointments
    }
}
