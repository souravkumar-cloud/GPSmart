'use client'

import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

/**
 * Hook to fetch a single order by ID with real-time updates
 * @param {string} id - Order ID
 * @returns {Object} { data, error, isLoading }
 */
export function useOrder({ id }) {
  const [data, setData] = useState(undefined)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setIsLoading(false)
      return
    }

    let isMounted = true

    const fetchOrder = async () => {
      try {
        const { data: orderData, error: fetchError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (*)
            )
          `)
          .eq('id', id)
          .single()

        if (!isMounted) return

        if (fetchError) throw fetchError

        setData(orderData)
        setError(null)
      } catch (err) {
        if (!isMounted) return
        console.error('Error fetching order:', err)
        setError(err.message)
        setData(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchOrder()

    // Set up real-time subscription
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (!isMounted) return
          if (payload.eventType === 'DELETE') {
            setData(null)
          } else {
            fetchOrder()
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [id])

  return { data, error, isLoading }
}

/**
 * Hook to fetch all orders for a specific user with real-time updates
 * @param {string} uid - User ID
 * @returns {Object} { data, error, isLoading }
 */
export function useOrders({ uid }) {
  const [data, setData] = useState(undefined)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setIsLoading(false)
      return
    }

    let isMounted = true

    const fetchOrders = async () => {
      try {
        const { data: ordersData, error: fetchError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (*)
            )
          `)
          .eq('user_id', uid)
          .order('created_at', { ascending: false })

        if (!isMounted) return

        if (fetchError) throw fetchError

        setData(ordersData.length === 0 ? null : ordersData)
        setError(null)
      } catch (err) {
        if (!isMounted) return
        console.error('Error fetching orders:', err)
        setError(err.message)
        setData(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchOrders()

    // Set up real-time subscription
    const channel = supabase
      .channel(`orders-user-${uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${uid}`,
        },
        () => {
          if (isMounted) {
            fetchOrders()
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [uid])

  return { data, error, isLoading }
}

/**
 * Hook to fetch all orders with pagination
 * @param {number} pageLimit - Number of items per page
 * @param {number} currentPage - Current page number (1-indexed)
 * @returns {Object} { data, error, isLoading, totalCount }
 */
export function useAllOrders({ pageLimit = 10, currentPage = 1 }) {
  const [data, setData] = useState(undefined)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    let isMounted = true

    const fetchOrders = async () => {
      try {
        // Get total count
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })

        if (!isMounted) return

        setTotalCount(count || 0)

        // Calculate pagination range
        const from = (currentPage - 1) * pageLimit
        const to = from + pageLimit - 1

        // Fetch orders with pagination
        const { data: ordersData, error: fetchError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (*)
            )
          `)
          .order('created_at', { ascending: false })
          .range(from, to)

        if (!isMounted) return

        if (fetchError) throw fetchError

        setData(ordersData.length === 0 ? null : ordersData)
        setError(null)
      } catch (err) {
        if (!isMounted) return
        console.error('Error fetching orders:', err)
        setError(err.message)
        setData(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchOrders()

    // Set up real-time subscription for any order changes
    const channel = supabase
      .channel('orders-all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          if (isMounted) {
            fetchOrders()
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [pageLimit, currentPage])

  return { 
    data, 
    error, 
    isLoading, 
    totalCount,
    totalPages: Math.ceil(totalCount / pageLimit)
  }
}

/**
 * Alternative hook for cursor-based pagination (similar to Firebase)
 * This is useful if you want to maintain Firebase-like behavior
 */
export function useAllOrdersCursor({ pageLimit = 10, lastOrderId = null }) {
  const [data, setData] = useState(undefined)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastId, setLastId] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchOrders = async () => {
      setIsLoading(true)
      try {
        let query = supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (*)
            )
          `)
          .order('created_at', { ascending: false })
          .limit(pageLimit)

        // If we have a lastOrderId, fetch orders created before that order
        if (lastOrderId) {
          const { data: lastOrder } = await supabase
            .from('orders')
            .select('created_at')
            .eq('id', lastOrderId)
            .single()

          if (lastOrder) {
            query = query.lt('created_at', lastOrder.created_at)
          }
        }

        const { data: ordersData, error: fetchError } = await query

        if (!isMounted) return

        if (fetchError) throw fetchError

        setData(ordersData.length === 0 ? null : ordersData)
        setLastId(ordersData.length > 0 ? ordersData[ordersData.length - 1].id : null)
        setError(null)
      } catch (err) {
        if (!isMounted) return
        console.error('Error fetching orders:', err)
        setError(err.message)
        setData(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchOrders()

    return () => {
      isMounted = false
    }
  }, [pageLimit, lastOrderId])

  return { data, error, isLoading, lastId }
}