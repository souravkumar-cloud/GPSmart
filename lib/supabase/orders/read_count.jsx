'use client'

import { supabase } from '@/lib/supabaseClient'
import useSWR from 'swr'

/**
 * Get orders count and total revenue for a specific date or all time
 * @param {Date|null} date - Date to filter by, or null for all time
 * @returns {Object} { totalRevenue, totalOrders, date }
 */
export const getOrdersCounts = async ({ date }) => {
  try {
    let query = supabase
      .from('orders')
      .select('total_amount', { count: 'exact' })

    // If date is provided, filter by that specific day
    if (date) {
      const fromDate = new Date(date)
      fromDate.setHours(0, 0, 0, 0)
      
      const toDate = new Date(date)
      toDate.setHours(23, 59, 59, 999)

      query = query
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())
    }

    const { data, error, count } = await query

    if (error) throw error

    // Calculate total revenue
    const totalRevenue = data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

    if (date) {
      return {
        date: `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`,
        data: {
          totalRevenue,
          totalOrders: count || 0,
        },
      }
    }

    return {
      totalRevenue,
      totalOrders: count || 0,
    }
  } catch (error) {
    console.error('Error getting orders counts:', error)
    throw error
  }
}

/**
 * Get total orders counts for multiple dates
 * @param {Array<Date>} dates - Array of dates to get counts for
 * @returns {Array} Array of count objects for each date
 */
const getTotalOrdersCounts = async (dates) => {
  let promisesList = []
  
  for (let i = 0; i < dates?.length; i++) {
    const date = dates[i]
    promisesList.push(getOrdersCounts({ date: date }))
  }
  
  const list = await Promise.all(promisesList)
  return list
}

/**
 * Hook to get overall orders count and revenue
 * @returns {Object} { data: { totalRevenue, totalOrders }, error, isLoading }
 */
export function useOrdersCounts() {
  const { data, error, isLoading } = useSWR(
    'orders_counts',
    () => getOrdersCounts({ date: null })
  )

  if (error) {
    console.log(error?.message)
  }

  return { data, error, isLoading }
}

/**
 * Hook to get orders counts by multiple dates (for charts/analytics)
 * @param {Array<Date>} dates - Array of dates
 * @returns {Object} { data: Array, error, isLoading }
 */
export function useOrdersCountsByTotalDays({ dates }) {
  const { data, error, isLoading } = useSWR(
    ['orders_count', dates],
    ([key, dates]) =>
      getTotalOrdersCounts(dates?.sort((a, b) => a?.getTime() - b?.getTime()))
  )

  if (error) {
    console.log(error?.message)
  }

  return { data, error, isLoading }
}

/**
 * Get orders statistics by status
 * @returns {Object} Status breakdown with counts
 */
export const getOrdersByStatus = async () => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('status, total_amount')

    if (error) throw error

    // Group by status
    const statusCounts = data.reduce((acc, order) => {
      const status = order.status || 'pending'
      if (!acc[status]) {
        acc[status] = { count: 0, revenue: 0 }
      }
      acc[status].count++
      acc[status].revenue += order.total_amount || 0
      return acc
    }, {})

    return statusCounts
  } catch (error) {
    console.error('Error getting orders by status:', error)
    throw error
  }
}

/**
 * Hook to get orders by status
 */
export function useOrdersByStatus() {
  const { data, error, isLoading } = useSWR(
    'orders_by_status',
    getOrdersByStatus
  )

  if (error) {
    console.log(error?.message)
  }

  return { data, error, isLoading }
}

/**
 * Get revenue statistics for a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Revenue statistics
 */
export const getRevenueByDateRange = async ({ startDate, endDate }) => {
  try {
    const { data, error, count } = await supabase
      .from('orders')
      .select('total_amount, created_at, status', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error

    const totalRevenue = data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    const averageOrderValue = count > 0 ? totalRevenue / count : 0

    // Get completed orders only
    const completedOrders = data?.filter(order => order.status === 'delivered') || []
    const completedRevenue = completedOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

    return {
      totalRevenue,
      totalOrders: count || 0,
      averageOrderValue,
      completedOrders: completedOrders.length,
      completedRevenue,
      pendingOrders: count - completedOrders.length,
      orders: data,
    }
  } catch (error) {
    console.error('Error getting revenue by date range:', error)
    throw error
  }
}

/**
 * Hook to get revenue by date range
 */
export function useRevenueByDateRange({ startDate, endDate }) {
  const { data, error, isLoading } = useSWR(
    ['revenue_by_date_range', startDate, endDate],
    () => getRevenueByDateRange({ startDate, endDate }),
    {
      revalidateOnFocus: false,
    }
  )

  if (error) {
    console.log(error?.message)
  }

  return { data, error, isLoading }
}

/**
 * Get top customers by order value
 * @param {number} limit - Number of top customers to return
 * @returns {Array} Array of top customers
 */
export const getTopCustomers = async ({ limit = 10 }) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('user_id, total_amount')

    if (error) throw error

    // Group by user and calculate totals
    const customerTotals = data.reduce((acc, order) => {
      const userId = order.user_id
      if (!acc[userId]) {
        acc[userId] = { user_id: userId, totalSpent: 0, orderCount: 0 }
      }
      acc[userId].totalSpent += order.total_amount || 0
      acc[userId].orderCount++
      return acc
    }, {})

    // Convert to array and sort by total spent
    const sortedCustomers = Object.values(customerTotals)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit)

    // Fetch user details
    const userIds = sortedCustomers.map(c => c.user_id)
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .in('id', userIds)

    // Merge customer data with user info
    return sortedCustomers.map(customer => {
      const user = users?.find(u => u.id === customer.user_id)
      return {
        ...customer,
        name: user?.name,
        email: user?.email,
        avatar_url: user?.avatar_url,
      }
    })
  } catch (error) {
    console.error('Error getting top customers:', error)
    throw error
  }
}

/**
 * Hook to get top customers
 */
export function useTopCustomers({ limit = 10 }) {
  const { data, error, isLoading } = useSWR(
    ['top_customers', limit],
    () => getTopCustomers({ limit })
  )

  if (error) {
    console.log(error?.message)
  }

  return { data, error, isLoading }
}