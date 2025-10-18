'use client'

import { supabase } from '@/lib/supabaseClient'

/**
 * Update order status
 * @param {string} id - Order ID
 * @param {string} status - New status value
 * @returns {Promise<Object>} { data, error }
 */
export const updateOrderStatus = async ({ id, status }) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating order status:', error)
    throw new Error(error.message || 'Failed to update order status')
  }
}

/**
 * Create a new order
 * @param {Object} orderData - Order data to create
 * @returns {Promise<Object>} { data, error }
 */
export const createOrder = async (orderData) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        ...orderData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creating order:', error)
    throw new Error(error.message || 'Failed to create order')
  }
}

/**
 * Update entire order
 * @param {string} id - Order ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} { data, error }
 */
export const updateOrder = async ({ id, updateData }) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating order:', error)
    throw new Error(error.message || 'Failed to update order')
  }
}

/**
 * Delete an order
 * @param {string} id - Order ID
 * @returns {Promise<Object>} { data, error }
 */
export const deleteOrder = async ({ id }) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error deleting order:', error)
    throw new Error(error.message || 'Failed to delete order')
  }
}

/**
 * Cancel an order (user-facing)
 * @param {string} id - Order ID
 * @param {string} userId - User ID (for security)
 * @returns {Promise<Object>} { data, error }
 */
export const cancelOrder = async ({ id, userId }) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId) // Security: ensure user owns the order
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error cancelling order:', error)
    throw new Error(error.message || 'Failed to cancel order')
  }
}

/**
 * Update payment status
 * @param {string} id - Order ID
 * @param {string} paymentStatus - Payment status
 * @returns {Promise<Object>} { data, error }
 */
export const updatePaymentStatus = async ({ id, paymentStatus }) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating payment status:', error)
    throw new Error(error.message || 'Failed to update payment status')
  }
}

/**
 * Add tracking information
 * @param {string} id - Order ID
 * @param {Object} trackingInfo - Tracking information
 * @returns {Promise<Object>} { data, error }
 */
export const addTrackingInfo = async ({ id, trackingInfo }) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        tracking_number: trackingInfo.trackingNumber,
        tracking_url: trackingInfo.trackingUrl,
        courier_name: trackingInfo.courierName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error adding tracking info:', error)
    throw new Error(error.message || 'Failed to add tracking information')
  }
}

/**
 * Bulk update order statuses
 * @param {Array} orderIds - Array of order IDs
 * @param {string} status - New status
 * @returns {Promise<Object>} { data, error }
 */
export const bulkUpdateOrderStatus = async ({ orderIds, status }) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .in('id', orderIds)
      .select()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error bulk updating orders:', error)
    throw new Error(error.message || 'Failed to bulk update orders')
  }
}