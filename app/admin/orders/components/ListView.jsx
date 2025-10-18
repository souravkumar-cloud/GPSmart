'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ListView() {
  const [pageLimit, setPageLimit] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    setCurrentPage(1)
  }, [pageLimit])

  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageLimit, currentPage])

  const fetchOrders = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })

      setTotalCount(count || 0)

      const from = (currentPage - 1) * pageLimit
      const to = from + pageLimit - 1

      const { data, error: fetchError } = await supabase
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

      if (fetchError) throw fetchError

      setOrders(data || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err.message)
      toast.error('Failed to fetch orders')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextPage = () => {
    if (currentPage * pageLimit < totalCount) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrePage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-medium">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-4 w-full">
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Items</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders?.map((item, index) => (
              <Row
                index={(currentPage - 1) * pageLimit + index + 1}
                item={item}
                key={item?.id}
              />
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No orders found</p>
        </div>
      )}

      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200">
        <button
          disabled={currentPage === 1}
          onClick={handlePrePage}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Page {currentPage} of {Math.ceil(totalCount / pageLimit) || 1}
          </span>
          <select
            value={pageLimit}
            onChange={(e) => setPageLimit(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        
        <button
          disabled={currentPage * pageLimit >= totalCount}
          onClick={handleNextPage}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}

function Row({ item, index }) {
  const getFirstProductName = () => {
    const firstItem = item?.order_items?.[0]
    if (!firstItem) return 'No items'
    
    const product = firstItem.products
    const productName = product?.name || 'Unknown Product'
    const itemCount = item?.order_items?.length || 0
    
    if (itemCount > 1) {
      return `${productName} +${itemCount - 1} more`
    }
    return productName
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      packed: 'bg-blue-50 text-blue-700 border-blue-200',
      'picked up': 'bg-purple-50 text-purple-700 border-purple-200',
      'in transit': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'out for delivery': 'bg-orange-50 text-orange-700 border-orange-200',
      delivered: 'bg-green-50 text-green-700 border-green-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
    }
    return colors[status?.toLowerCase()] || colors.pending
  }

  const getPaymentColor = (mode) => {
    const colors = {
      cod: 'bg-orange-50 text-orange-700 border-orange-200',
      online: 'bg-blue-50 text-blue-700 border-blue-200',
      card: 'bg-purple-50 text-purple-700 border-purple-200',
    }
    return colors[mode?.toLowerCase()] || colors.cod
  }

  // Extract customer info from shipping_address
  let address = item?.shipping_address || {}
  if (typeof address === 'string') {
    try {
      address = JSON.parse(address)
    } catch (e) {
      address = {}
    }
  }

  const userName = address?.name || 'Unknown User'
  const userEmail = item?.email || address?.email || 'No email'
  const userInitial = userName?.charAt(0)?.toUpperCase() || '?'

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-4 text-sm text-gray-700 font-medium">
        {index}
      </td>
      <td className="px-4 py-4">
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
            {userInitial}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {userName}
            </span>
            <span className="text-xs text-gray-500 truncate max-w-[200px]">
              {userEmail}
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="text-sm font-semibold text-gray-900">{getFirstProductName()}</span>
      </td>
      <td className="px-4 py-4">
        <span className="text-sm font-semibold text-gray-900">₹{item?.total_amount?.toLocaleString() || '0'}</span>
      </td>
      
      <td className="px-4 py-4">
        <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
          {item?.order_items?.length || 0}
        </span>
      </td>
      <td className="px-4 py-4">
        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium uppercase border ${getPaymentColor(item?.payment_mode)}`}>
          {item?.payment_mode || 'N/A'}
        </span>
      </td>
      <td className="px-4 py-4">
        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium uppercase border ${getStatusColor(item?.status)}`}>
          {item?.status || 'pending'}
        </span>
      </td>
      <td className="px-4 py-4 text-center">
        <Link href={`/admin/orders/${item?.id}`}>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </button>
        </Link>
      </td>
    </tr>
  )
}