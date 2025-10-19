'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { validateProductStock, processMultipleProductsOrder } from '@/lib/supabase/products/write'

export default function CheckoutPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const type = searchParams.get('type')
  const productId = searchParams.get('productId')
  
  const [loading, setLoading] = useState(true)
  const [productList, setProductList] = useState([])
  const [submitting, setSubmitting] = useState(false)
  
  const [shippingForm, setShippingForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
  })
  
  const [paymentMode, setPaymentMode] = useState('cod')

  useEffect(() => {
    if (!user?.id) {
      router.push('/login')
      return
    }

    // Auto-populate email from logged-in user
    if (user?.email) {
      setShippingForm((prev) => ({
        ...prev,
        email: user.email,
      }))
    }

    fetchCheckoutData()
  }, [user?.id, user?.email, type, productId])

  const fetchCheckoutData = async () => {
    try {
      setLoading(true)

      if (type === 'buynow' && productId) {
        const { data: product, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()

        if (error) throw error

        // Check if product has stock
        if (product.stock < 1) {
          toast.error('This product is out of stock')
          router.push('/')
          return
        }

        setProductList([
          {
            id: productId,
            quantity: 1,
            product: product,
            price: product.sale_price || product.price,
          },
        ])
      } else {
        const { data: cartItems, error } = await supabase
          .from('cart')
          .select(`
            *,
            products (*)
          `)
          .eq('user_id', user.id)

        if (error) throw error

        if (!cartItems || cartItems.length === 0) {
          toast.error('Your cart is empty')
          router.push('/cart')
          return
        }

        const formattedProducts = cartItems.map((item) => ({
          id: item.product_id,
          quantity: item.quantity,
          product: item.products,
          price: item.products.sale_price || item.products.price,
        }))

        setProductList(formattedProducts)
      }
    } catch (error) {
      console.error('Error fetching checkout data:', error)
      toast.error('Failed to load checkout data')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    return productList.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setShippingForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    const { name, email, phone, address, city, state, pincode } = shippingForm

    if (!name.trim()) {
      toast.error('Please enter your name')
      return false
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return false
    }
    if (!phone.trim() || phone.length < 10) {
      toast.error('Please enter a valid phone number')
      return false
    }
    if (!address.trim()) {
      toast.error('Please enter your address')
      return false
    }
    if (!city.trim()) {
      toast.error('Please enter your city')
      return false
    }
    if (!state.trim()) {
      toast.error('Please enter your state')
      return false
    }
    if (!pincode.trim() || pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode')
      return false
    }

    return true
  }

  const handlePlaceOrder = async () => {
    if (!validateForm()) return

    setSubmitting(true)

    try {
      const totalAmount = calculateTotal()

      // Step 1: Validate stock availability
      console.log('🔍 Validating stock for products:', productList);
      
      const orderItems = productList.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      }))

      const stockValidation = await validateProductStock(orderItems)
      
      if (!stockValidation.valid) {
        const insufficientItems = stockValidation.items
          .filter(item => !item.sufficient)
          .map(item => `${item.productName}: Need ${item.requested}, Available ${item.available}`)
          .join('\n')
        
        toast.error(`Insufficient stock:\n${insufficientItems}`, { duration: 5000 })
        
        // Redirect to cart to update quantities
        if (type !== 'buynow') {
          router.push('/cart')
        }
        return
      }

      console.log('✅ Stock validation passed');

      // Step 2: Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: user.id,
            email: shippingForm.email,
            total_amount: totalAmount,
            status: 'pending',
            payment_mode: paymentMode,
            shipping_address: shippingForm,
          },
        ])
        .select()
        .single()

      if (orderError) throw orderError

      console.log('✅ Order created:', order.id);

      // Step 3: Store order items in order_items table
      const orderItemsData = productList.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData)

      if (itemsError) {
        // Rollback: Delete the order if items creation fails
        await supabase.from('orders').delete().eq('id', order.id)
        throw new Error('Failed to create order items: ' + itemsError.message)
      }

      console.log('✅ Order items created');

      // Step 4: Process stock and orders count (decrease stock, increase orders)
      try {
        const productResults = await processMultipleProductsOrder(orderItems)
        
        if (productResults.failed.length > 0) {
          console.warn('⚠️ Some products failed to update stock:', productResults.failed)
          // Note: Order is still successful, but log the issue
        }
        
        console.log(`✅ Stock updated for ${productResults.success.length} products`);
      } catch (stockError) {
        console.error('❌ Failed to update stock:', stockError)
        // Order is created successfully, but stock update failed
        // You might want to add this to a queue for manual review
      }

      // Step 5: Clear cart if this was a cart checkout (not buy now)
      if (type !== 'buynow') {
        const { error: clearCartError } = await supabase
          .from('cart')
          .delete()
          .eq('user_id', user.id)

        if (clearCartError) {
          console.warn('Failed to clear cart:', clearCartError)
        }

        // Dispatch cart update event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('cartUpdate', {
              detail: { action: 'clear' },
            })
          )
        }
      }

      toast.success('Order placed successfully! 🎉')
      router.push(`/checkout/success?orderId=${order.id}`)
    } catch (error) {
      console.error('Error placing order:', error)
      toast.error(error.message || 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    )
  }

  if (!productList || productList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShoppingBag size={80} className="mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            No Products Found
          </h2>
          <p className="text-gray-600 mb-8">
            Please add products to your cart first.
          </p>
          <Link href="/">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg">
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const total = calculateTotal()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/cart">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
              <ArrowLeft size={20} />
              <span>Back to Cart</span>
            </button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Shipping Address
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={shippingForm.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={shippingForm.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={shippingForm.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 *
                  </label>
                  <textarea
                    name="address"
                    value={shippingForm.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="House No., Building Name, Street, Area"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="address_line2"
                    value={shippingForm.address_line2}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Landmark, Building name, etc. (Optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={shippingForm.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter city"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={shippingForm.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter state"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={shippingForm.pincode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    name="notes"
                    value={shippingForm.notes}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any special instructions (Optional)"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Payment Method
              </h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="radio"
                    name="paymentMode"
                    value="cod"
                    checked={paymentMode === 'cod'}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-gray-800">Cash on Delivery</p>
                    <p className="text-sm text-gray-600">Pay when you receive</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {productList.map((item) => {
                  const imageUrl = Array.isArray(item.product?.featured_img)
                    ? item.product.featured_img[0]
                    : item.product?.featured_img || item.product?.image_url

                  return (
                    <div key={item.id} className="flex gap-3 pb-3 border-b">
                      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={item.product?.name || 'Product'}
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
                        <h3 className="text-sm font-semibold text-gray-800 truncate">
                          {item.product?.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          ₹{item.price.toLocaleString()} × {item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({productList.length} items)</span>
                  <span className="font-semibold">₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Device Installment</span>
                  <span>₹12</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-800">
                  <span>Total</span>
                  <span className="text-green-600">₹{(total + 12).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Placing Order...</span>
                  </div>
                ) : (
                  `Place Order - ₹${(total + 12).toLocaleString()}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}