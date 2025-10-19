'use client'

import { supabase } from '@/lib/supabaseClient'
import { processMultipleProductsOrder, validateProductStock } from '@/lib/supabase/products/write'

/**
 * Send status update email to customer
 * @param {string} orderId - Order ID
 * @param {string} userEmail - Customer email
 * @param {string} status - Order status
 * @param {Object} orderData - Order details
 * @returns {Promise<boolean>} Success status
 */
const sendStatusUpdateEmail = async (orderId, userEmail, status, orderData) => {
  try {
    console.log('📧 Attempting to send email:', { 
      orderId, 
      userEmail, 
      status,
      hasOrderData: !!orderData 
    })
    
    const requestBody = {
      orderId,
      userEmail,
      status,
      orderData,
    }
    
    console.log('📧 Request body:', JSON.stringify(requestBody, null, 2))
    
    const response = await fetch('/api/emails/send-order-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log('📧 Response status:', response.status, response.statusText)
    
    const responseText = await response.text()
    console.log('📧 Response text:', responseText)
    
    let responseData
    
    try {
      responseData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('❌ Failed to parse response:', parseError)
      responseData = { raw: responseText, parseError: parseError.message }
    }
    
    if (!response.ok) {
      console.error('❌ Failed to send status email:', {
        httpStatus: response.status,
        httpStatusText: response.statusText,
        responseBody: responseData,
        orderId,
        userEmail,
        requestedStatus: status
      })
      return false
    }

    console.log(`✅ Status update email sent successfully`)
    console.log('✅ Email details:', { userEmail, status, responseData })
    return true
  } catch (error) {
    console.error('❌ Exception in sendStatusUpdateEmail:', {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack,
      orderId,
      userEmail,
      status
    })
    return false
  }
}

/**
 * Update order status
 * @param {string} id - Order ID
 * @param {string} status - New status value
 * @returns {Promise<Object>} { data, error }
 */
export const updateOrderStatus = async ({ id, status }) => {
  try {
    // Fetch current order details before updating
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Get user email from order data
    const userEmail = currentOrder?.email || currentOrder?.customer_email || null
    
    console.log('📧 User email found:', userEmail)

    // Update order status
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

    // Send status update email to customer on any status change
    if (userEmail) {
      await sendStatusUpdateEmail(id, userEmail, status, currentOrder)
    } else {
      console.warn('⚠️ No email found for order:', id)
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error updating order status:', error)
    throw new Error(error.message || 'Failed to update order status')
  }
}

/**
 * Create a new order with automatic stock management
 * @param {Object} orderData - Order data to create
 * @param {Array} orderItems - Array of order items with product_id and quantity
 * @returns {Promise<Object>} { data, error }
 */
export const createOrder = async (orderData, orderItems = []) => {
  try {
    console.log('🛍️ Creating order with items:', orderItems);

    // Step 1: Validate stock availability for all products
    if (orderItems.length > 0) {
      const stockValidation = await validateProductStock(orderItems);
      
      if (!stockValidation.valid) {
        const insufficientItems = stockValidation.items
          .filter(item => !item.sufficient)
          .map(item => `${item.productName}: Need ${item.requested}, Available ${item.available}`)
          .join(', ');
        
        throw new Error(`Insufficient stock: ${insufficientItems}`);
      }
      
      console.log('✅ Stock validation passed');
    }

    // Step 2: Create the order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([{
        ...orderData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    console.log('✅ Order created:', newOrder.id);

    // Step 3: Create order items
    if (orderItems.length > 0) {
      const orderItemsWithOrderId = orderItems.map(item => ({
        order_id: newOrder.id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price || 0,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsWithOrderId);

      if (itemsError) {
        // Rollback: Delete the order if items creation fails
        await supabase.from('orders').delete().eq('id', newOrder.id);
        throw new Error('Failed to create order items: ' + itemsError.message);
      }

      console.log('✅ Order items created');

      // Step 4: Process stock and orders count for each product
      try {
        const productResults = await processMultipleProductsOrder(orderItems);
        
        if (productResults.failed.length > 0) {
          console.warn('⚠️ Some products failed to update:', productResults.failed);
        }
        
        console.log(`✅ Stock updated for ${productResults.success.length} products`);
      } catch (stockError) {
        console.error('❌ Failed to update stock:', stockError);
      }
    }

    // Step 5: Send order confirmation email
    const userEmail = newOrder?.email || newOrder?.customer_email || orderData?.email || null;
    
    if (userEmail) {
      console.log('📧 Sending order confirmation email to:', userEmail);
      await sendOrderConfirmationEmail(newOrder.id, userEmail, newOrder, orderItems);
    } else {
      console.warn('⚠️ No email found for new order:', newOrder.id);
    }

    return { data: newOrder, error: null };
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error(error.message || 'Failed to create order');
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
 * Cancel an order and restore stock (user-facing)
 * @param {string} id - Order ID
 * @param {string} userId - User ID (for security)
 * @param {boolean} restoreStock - Whether to restore stock (default: true)
 * @returns {Promise<Object>} { data, error }
 */
export const cancelOrder = async ({ id, userId, restoreStock = true }) => {
  try {
    // First get the order with user_id
    const { data: order, error: orderFetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (orderFetchError) throw orderFetchError

    // Get user email from order data if available
    let userEmail = order?.customer_email || order?.email || null
    
    console.log('📧 User email for cancellation:', userEmail)

    // Then get order items if we need to restore stock
    if (restoreStock) {
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', id);

      if (itemsError) throw itemsError;

      // Restore stock for each product
      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          try {
            const { data: product, error: fetchError } = await supabase
              .from('products')
              .select('stock, orders')
              .eq('id', item.product_id)
              .single();

            if (fetchError) {
              console.error(`Failed to fetch product ${item.product_id}:`, fetchError);
              continue;
            }

            const newStock = (product.stock || 0) + item.quantity;
            const newOrders = Math.max(0, (product.orders || 0) - item.quantity);

            const { error: updateError } = await supabase
              .from('products')
              .update({ 
                stock: newStock,
                orders: newOrders
              })
              .eq('id', item.product_id);

            if (updateError) {
              console.error(`Failed to restore stock for product ${item.product_id}:`, updateError);
            } else {
              console.log(`✅ Stock restored for product ${item.product_id}: +${item.quantity}`);
            }
          } catch (err) {
            console.error(`Error processing product ${item.product_id}:`, err);
          }
        }
      }
    }

    // Update order status to cancelled
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    // Send cancellation email
    if (userEmail) {
      await sendStatusUpdateEmail(id, userEmail, 'cancelled', order)
    } else {
      console.warn('⚠️ No email found for cancelled order:', id)
    }

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