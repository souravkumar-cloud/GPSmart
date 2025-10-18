'use client'

import { useOrder } from '@/lib/supabase/orders/read'
import { useParams } from 'next/navigation'
import ChangeOrderStatus from './components/ChangeStatus'
import { useState } from 'react'

export default function Page() {
  const { orderId } = useParams()
  const { data: order, error, isLoading } = useOrder({ id: orderId })
  const [status, setStatus] = useState(order?.status)

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600">Order not found</div>
      </div>
    )
  }

  const totalAmount = order?.total_amount || 0
  
  let address = order?.shipping_address || {}
  if (typeof address === 'string') {
    try {
      address = JSON.parse(address)
    } catch (e) {
      address = {}
    }
  }

  const currentStatus = status || order?.status

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order #{orderId}</h1>
          <ChangeOrderStatus order={{ ...order, status: currentStatus }} onStatusChange={handleStatusChange} />
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{currentStatus}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Mode</p>
              <p className="text-lg font-semibold text-gray-900 uppercase">{order?.payment_mode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-lg font-semibold text-green-600">₹{totalAmount.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">{new Date(order?.created_at).toLocaleDateString()} at {new Date(order?.created_at).toLocaleTimeString()}</p>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
          <div className="space-y-4">
            {order?.order_items?.map((item) => {
              const product = item.products
              const imageUrl = Array.isArray(product?.featured_img)
                ? product.featured_img[0]
                : product?.featured_img || product?.image_url

              return (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                  <img
                    src={imageUrl || '/placeholder.png'}
                    alt={product?.name}
                    className="w-20 h-20 rounded-lg object-cover bg-gray-100"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{product?.name}</h3>
                    <p className="text-sm text-gray-600">₹{item?.price?.toLocaleString()} × {item?.quantity}</p>
                    <p className="text-lg font-semibold text-gray-900">₹{(item?.price * item?.quantity).toLocaleString()}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="text-gray-900 font-medium">{address?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-gray-900 font-medium">{order?.email || address?.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="text-gray-900 font-medium">{address?.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">City</p>
              <p className="text-gray-900 font-medium">{address?.city || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Address</p>
              <p className="text-gray-900 font-medium">{address?.address || '-'}</p>
            </div>
            {address?.address_line2 && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Landmark</p>
                <p className="text-gray-900 font-medium">{address?.address_line2}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">State</p>
              <p className="text-gray-900 font-medium">{address?.state || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pincode</p>
              <p className="text-gray-900 font-medium">{address?.pincode || '-'}</p>
            </div>
            {address?.notes && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Special Instructions</p>
                <p className="text-gray-900 font-medium">{address?.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}