'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CartPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingItems, setUpdatingItems] = useState({})
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    // Show loading for at least 500ms on page load
    const timer = setTimeout(() => {
      setInitialLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!user?.id) {
      router.push('/login')
      return
    }
    
    fetchCartItems()

    // Real-time subscription
    const channel = supabase
      .channel(`cart:user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchCartItems()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const fetchCartItems = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('cart')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCartItems(data || [])
    } catch (error) {
      console.error('Error fetching cart:', error)
      toast.error('Failed to load cart')
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (cartId, newQuantity) => {
    if (newQuantity < 1) return

    setUpdatingItems(prev => ({ ...prev, [cartId]: true }))

    // Optimistically update UI immediately
    setCartItems(prev => 
      prev.map(item => 
        item.id === cartId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    )

    try {
      const { error } = await supabase
        .from('cart')
        .update({ quantity: newQuantity })
        .eq('id', cartId)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Quantity updated')
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Failed to update quantity')
      // Refetch on error to restore correct quantity
      fetchCartItems()
    } finally {
      setUpdatingItems(prev => ({ ...prev, [cartId]: false }))
    }
  }

  const removeItem = async (cartId) => {
    setUpdatingItems(prev => ({ ...prev, [cartId]: true }))

    // Optimistically remove from UI immediately
    setCartItems(prev => prev.filter(item => item.id !== cartId))

    // Dispatch custom event to update header instantly
    window.dispatchEvent(new CustomEvent('cartUpdate', { 
      detail: { action: 'remove' } 
    }))

    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('id', cartId)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Removed from cart')
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Failed to remove item')
      // Refetch on error to restore the item
      fetchCartItems()
      window.dispatchEvent(new CustomEvent('cartUpdate', { 
        detail: { action: 'add' } 
      }))
    } finally {
      setUpdatingItems(prev => ({ ...prev, [cartId]: false }))
    }
  }

  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return

    // Optimistically clear UI immediately
    const previousItems = cartItems
    setCartItems([])

    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Cart cleared')
    } catch (error) {
      console.error('Error clearing cart:', error)
      toast.error('Failed to clear cart')
      // Restore items on error
      setCartItems(previousItems)
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.products?.sale_price || item.products?.price || 0
      return total + (price * item.quantity)
    }, 0)
  }

  const calculateSavings = () => {
    return cartItems.reduce((savings, item) => {
      if (item.products?.price && item.products?.sale_price) {
        const itemSavings = (item.products.price - item.products.sale_price) * item.quantity
        return savings + itemSavings
      }
      return savings
    }, 0)
  }

  // Show loading screen for first 500ms or while data is loading
  if (initialLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShoppingBag size={80} className="mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            Your Cart is Empty
          </h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added anything to your cart yet.
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
  const savings = calculateSavings()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
              <ArrowLeft size={20} />
              <span>Continue Shopping</span>
            </button>
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Shopping Cart
              <span className="text-lg text-gray-500 ml-3">
                ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
              </span>
            </h1>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const product = item.products
              const imageUrl = Array.isArray(product?.featured_img)
                ? product.featured_img[0]
                : product?.featured_img || product?.image_url
              const price = product?.sale_price || product?.price || 0
              const originalPrice = product?.price
              const discount = originalPrice && product?.sale_price
                ? Math.round(((originalPrice - product.sale_price) / originalPrice) * 100)
                : 0

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <Link href={`/product/${product?.id}`}>
                      <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden cursor-pointer">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product?.name || 'Product'}
                            fill
                            className="object-contain hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ShoppingBag size={40} />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${product?.id}`}>
                        <h3 className="font-semibold text-gray-800 hover:text-blue-600 cursor-pointer line-clamp-2 mb-2">
                          {product?.name}
                        </h3>
                      </Link>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-xl font-bold text-green-600">
                          ₹{price.toLocaleString()}
                        </p>
                        {originalPrice && originalPrice > price && (
                          <>
                            <p className="text-sm text-gray-500 line-through">
                              ₹{originalPrice.toLocaleString()}
                            </p>
                            {discount > 0 && (
                              <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded">
                                {discount}% OFF
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updatingItems[item.id]}
                            className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="text-lg font-semibold min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={updatingItems[item.id]}
                            className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={updatingItems[item.id]}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove from cart"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <p className="text-sm text-gray-600 mt-3">
                        Subtotal: <span className="font-semibold text-gray-800">₹{(price * item.quantity).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="font-semibold">₹{total.toLocaleString()}</span>
                </div>
                
                {savings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Savings</span>
                    <span className="font-semibold">- ₹{savings.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>

                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-800">
                  <span>Total</span>
                  <span className="text-green-600">₹{total.toLocaleString()}</span>
                </div>
              </div>

              <Link href="/checkout">
                <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg mb-3">
                  Proceed to Checkout
                </button>
              </Link>

              <Link href="/">
                <button className="w-full py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-all">
                  Continue Shopping
                </button>
              </Link>

              {/* Security Badge */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}