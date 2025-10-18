'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { ShoppingCart, LayoutDashboard, Package } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { CART_ACTIONS } from '@/lib/cartUtils'

const Header = () => {
  const { user, isAdmin, signOut } = useAuth()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const updateTimeoutRef = useRef(null)

  const menuList = [
    {
      name: "Home",
      link: "/"
    },
    {
      name: "About Us",
      link: "/about-us"
    },
    {
      name: "Contact Us",
      link: "/contact-us"
    }
  ]

  // Fetch cart count
  useEffect(() => {
    if (user?.id) {
      fetchCartCount()
      
      // Listen for custom cart update events (instant updates)
      const handleCartUpdate = (event) => {
        // Clear any pending timeout to prevent double updates
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current)
        }

        const { action } = event.detail
        
        if (action === CART_ACTIONS.ADD) {
          setCartCount(prev => prev + 1)
        } else if (action === CART_ACTIONS.REMOVE) {
          setCartCount(prev => Math.max(0, prev - 1))
        } else if (action === CART_ACTIONS.CLEAR) {
          setCartCount(0)
        } else if (action === CART_ACTIONS.REFRESH) {
          fetchCartCount()
        }

        // Set a debounce flag to ignore real-time updates for 1 second
        updateTimeoutRef.current = setTimeout(() => {
          updateTimeoutRef.current = null
        }, 1000)
      }

      window.addEventListener('cartUpdate', handleCartUpdate)
      
      // Real-time subscription for cart updates (backup for sync across tabs)
      const channel = supabase
        .channel(`cart-header:user_id=eq.${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "cart",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Only process real-time updates if there's no recent custom event
            if (!updateTimeoutRef.current) {
              if (payload.eventType === 'INSERT') {
                setCartCount(prev => prev + 1)
              } else if (payload.eventType === 'DELETE') {
                setCartCount(prev => Math.max(0, prev - 1))
              } else if (payload.eventType === 'UPDATE') {
                fetchCartCount()
              }
            }
          }
        )
        .subscribe()

      return () => {
        window.removeEventListener('cartUpdate', handleCartUpdate)
        supabase.removeChannel(channel)
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current)
        }
      }
    } else {
      setCartCount(0)
    }
  }, [user?.id])

  const fetchCartCount = async () => {
    if (!user?.id) return

    const { count, error } = await supabase
      .from("cart")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (!error) {
      setCartCount(count || 0)
    }
  }

  const getInitials = (email) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  const getAvatarColor = (email) => {
    if (!email) return 'bg-slate-600'
    const colors = [
      'bg-blue-600',
      'bg-emerald-600',
      'bg-violet-600',
      'bg-rose-600',
      'bg-indigo-600',
      'bg-amber-600',
    ]
    const index = email.charCodeAt(0) % colors.length
    return colors[index]
  }

  const handleLogout = async () => {
    await signOut()
    setShowUserMenu(false)
    router.push('/login')
  }

  // Get user profile image - priority: Supabase imageURL > Gmail photo > initials
  const getUserAvatar = () => {
    // If user has uploaded image in Supabase
    if (user?.photoURL && !imageError) {
      return (
        <img 
          src={user.photoURL} 
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover shadow-md ring-2 ring-white hover:ring-gray-200 transition-all duration-200"
          onError={() => setImageError(true)}
        />
      )
    }

    // Fallback to initials
    return (
      <div className={`w-10 h-10 rounded-full ${getAvatarColor(user?.email)} flex items-center justify-center text-white font-semibold text-base shadow-md ring-2 ring-white hover:ring-gray-200 transition-all duration-200`}>
        {getInitials(user?.email)}
      </div>
    )
  }

  return (
    <header className='sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm'>
      <nav className='max-w-7xl mx-auto flex justify-between items-center py-4 px-6 lg:px-8'>
        {/* Logo */}
        <Link href="/" className='flex-shrink-0'>
          <img src="/logo.png" alt="logo" className='h-9 w-auto cursor-pointer hover:opacity-90 transition-opacity' />
        </Link>

        {/* Navigation Links */}
        <div className='hidden md:flex gap-1 items-center'>
          {menuList?.map((item, index) => (
            <Link key={item?.id || index} href={item?.link}>
              <button className='px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200'>
                {item?.name}
              </button>
            </Link>
          ))}
        </div>

        {/* User Actions */}
        <div className='flex items-center gap-3'>
          {user ? (
            <div className='flex items-center gap-3'>
              {/* Cart Button */}
              <Link href='/cart'>
                <button
                  title='Cart'
                  className='relative p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200'>
                  <ShoppingCart size={24} />
                  {cartCount > 0 && (
                    <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md'>
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </button>
              </Link>

              {/* Admin Panel / My Orders Button */}
              {isAdmin ? (
                <Link href='/admin'>
                  <button 
                    title='Admin Panel'
                    className='hidden sm:flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md'>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </Link>
              ) : (
                <Link href='/orders'>
                  <button
                    title='My Orders'
                    className='hidden sm:flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md'>
                    <Package size={16} />
                  </button>
                </Link>
              )}

              {/* User Menu */}
              <div className='relative'>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className='flex items-center gap-2 hover:opacity-80 transition-opacity'
                  title={user?.email}
                >
                  {getUserAvatar()}
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div 
                      className='fixed inset-0 z-10' 
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className='absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20'>
                      <div className='px-4 py-3 border-b border-gray-100'>
                        <p className='text-sm font-medium text-gray-900 truncate'>
                          {user?.email}
                        </p>
                        {user?.name && (
                          <p className='text-xs text-gray-600 mt-1'>
                            {user.name}
                          </p>
                        )}
                        {isAdmin && (
                          <span className='inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-700 rounded'>
                            Admin
                          </span>
                        )}
                      </div>
                      
                      <Link href='/cart' onClick={() => setShowUserMenu(false)}>
                        <button className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2'>
                          <ShoppingCart size={16} />
                          My Cart
                          {cartCount > 0 && (
                            <span className='ml-auto bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full'>
                              {cartCount}
                            </span>
                          )}
                        </button>
                      </Link>

                      <Link href='/orders' onClick={() => setShowUserMenu(false)}>
                        <button className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2'>
                          <Package size={16} />
                          My Orders
                        </button>
                      </Link>

                      {/* Show Admin Panel or My Orders based on role */}
                      {isAdmin ? (
                        <Link href='/admin' onClick={() => setShowUserMenu(false)}>
                          <button className='sm:hidden w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2'>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Admin Panel
                          </button>
                        </Link>
                      ) : null}
                      
                      <button 
                        onClick={handleLogout}
                        className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium'
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <Link href='/login'>
              <button className='px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md text-sm'>
                Login
              </button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Header