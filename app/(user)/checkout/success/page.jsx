'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle, Package, ShoppingBag } from 'lucide-react'
import Confetti from 'react-confetti'

export default function CheckoutSuccessPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      router.push('/login')
      return
    }

    if (!orderId) {
      router.push('/')
      return
    }

    fetchOrderDetails()

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [user?.id, orderId])

  const fetchOrderDetails = async () => {
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
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      setOrder(data)
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Package size={80} className="mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            Order Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            We couldn't find this order. Please check your orders page.
          </p>
          <Link href="/orders">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg">
              View My Orders
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {showConfetti && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 300}
          height={typeof window !== 'undefined' ? window.innerHeight : 200}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Message */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center mb-6">
            <div className="mb-6">
              <CheckCircle size={80} className="mx-auto text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Order Placed Successfully! 🎉
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for your order. We've received it and will process it soon.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
              <p className="text-sm text-gray-600 mb-1">Order ID</p>
              <p className="text-xl font-bold text-blue-600">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Details</h2>

            {/* Order Items */}
            <div className="space-y-3 mb-6">
              {order.order_items?.map((item) => {
                const product = item.products
                const imageUrl = Array.isArray(product?.featured_img)
                  ? product.featured_img[0]
                  : product?.featured_img || product?.image_url

                return (
                  <div key={item.id} className="flex gap-4 items-center pb-3 border-b">
                    <div className="relative w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={product?.name || 'Product'}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingBag size={32} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800">
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

            {/* Payment & Shipping Info */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-t">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-semibold text-gray-800 capitalize">
                  {order.payment_mode === 'cod' ? 'Cash on Delivery' : order.payment_mode}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Order Status</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-semibold rounded-full capitalize">
                  {order.status}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-t">
                <span className="text-lg font-semibold text-gray-800">Total Amount</span>
                <span className="text-2xl font-bold text-green-600">
                  ₹{order.total_amount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Shipping Address</h2>
            <div className="text-gray-700">
              <p className="font-semibold">{order.shipping_address.name}</p>
              <p>{order.shipping_address.address}</p>
              <p>
                {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
              </p>
              <p className="mt-2">Phone: {order.shipping_address.phone}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/orders" className="flex-1">
              <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg">
                View My Orders
              </button>
            </Link>
            <Link href="/" className="flex-1">
              <button className="w-full py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-all">
                Continue Shopping
              </button>
            </Link>
          </div>

          {/* Estimated Delivery */}
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-semibold">
              📦 Estimated delivery in 5-7 business days
            </p>
            <p className="text-sm text-green-700 mt-1">
              You will receive order updates via email
            </p>
          </div>
        </div>
      </div>
    </>
  )
}