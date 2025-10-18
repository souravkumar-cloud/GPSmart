'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Package, ShoppingBag, Calendar, CreditCard, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OrdersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingOrderId, setCancellingOrderId] = useState(null)

  useEffect(() => {
    if (!user?.id) {
      router.push('/login')
      return
    }

    fetchOrders()
  }, [user?.id])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId, currentStatus) => {
    // Check if order can be cancelled
    if (currentStatus === 'delivered' || currentStatus === 'cancelled') {
      toast.error(`Cannot cancel ${currentStatus} orders`)
      return
    }

    // Confirm cancellation
    if (!confirm('Are you sure you want to cancel this order?')) {
      return
    }

    setCancellingOrderId(orderId)

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('user_id', user.id) // Security: ensure user owns the order

      if (error) throw error

      toast.success('Order cancelled successfully')
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'cancelled' }
          : order
      ))
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error('Failed to cancel order. Please try again.')
    } finally {
      setCancellingOrderId(null)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    return colors[status?.toLowerCase()] || colors.pending
  }

  const getPaymentModeColor = (mode) => {
    const colors = {
      cod: 'bg-orange-100 text-orange-700',
      online: 'bg-blue-100 text-blue-700',
      card: 'bg-indigo-100 text-indigo-700'
    }
    return colors[mode?.toLowerCase()] || colors.cod
  }

  const canCancelOrder = (status) => {
    const cancelableStatuses = ['pending', 'processing']
    return cancelableStatuses.includes(status?.toLowerCase())
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Package size={80} className="mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            No Orders Yet
          </h2>
          <p className="text-gray-600 mb-8">
            You haven't placed any orders yet. Start shopping to see your orders here!
          </p>
          <Link href="/">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg">
              Start Shopping
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Orders</h1>
          <p className="text-gray-600">
            Track and manage your orders
          </p>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order, index) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Order Header */}
              <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">Order #{index + 1}</span>
                </div>
                
                <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                
                <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase ${getPaymentModeColor(order.payment_mode)}`}>
                  {order.payment_mode}
                </span>

                <div className="flex items-center gap-2 text-gray-600 text-sm ml-auto">
                  <Calendar size={16} />
                  <span>
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3 mb-4">
                {order.order_items?.map((item) => {
                  const product = item.products
                  const imageUrl = Array.isArray(product?.featured_img)
                    ? product.featured_img[0]
                    : product?.featured_img || product?.image_url

                  return (
                    <div key={item.id} className="flex gap-4 items-center">
                      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product?.name || 'Product'}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ShoppingBag size={24} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate">
                          {product?.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          ₹{item.price.toLocaleString()} × {item.quantity}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-gray-800">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Order Footer */}
              <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-gray-600">
                  <CreditCard size={16} />
                  <span className="text-sm">
                    {order.payment_mode === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Cancel Button */}
                  {canCancelOrder(order.status) && (
                    <button
                      onClick={() => handleCancelOrder(order.id, order.status)}
                      disabled={cancellingOrderId === order.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-200"
                    >
                      <XCircle size={16} />
                      {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}

                  {/* Total Amount */}
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-xl font-bold text-green-600">
                      ₹{order.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shipping_address && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Shipping Address:</p>
                  <p className="text-sm text-gray-600">
                    {order.shipping_address.name && `${order.shipping_address.name}, `}
                    {order.shipping_address.address}, {order.shipping_address.city}, 
                    {order.shipping_address.state} - {order.shipping_address.pincode}
                    {order.shipping_address.phone && `, Phone: ${order.shipping_address.phone}`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}