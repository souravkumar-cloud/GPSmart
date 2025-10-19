'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

// Global flag to prevent multiple auth listeners (persists across re-renders)
let authListenerInitialized = false
let authSubscription = null

// Check if user is admin
const checkIsAdmin = async (user) => {
  if (!user?.email) return false
  
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('email')
      .eq('email', user.email.toLowerCase())
      .single()
    
    return !error && !!data
  } catch (err) {
    return false
  }
}

export default function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Format user data
  const formatUser = (supabaseUser) => {
    if (!supabaseUser) return null
    return {
      ...supabaseUser,
      photoURL: supabaseUser?.user_metadata?.avatar_url || null,
    }
  }

  useEffect(() => {
    // Only initialize once globally
    if (authListenerInitialized) {
      console.log('⚠️ Auth already initialized, skipping...')
      return
    }
    
    authListenerInitialized = true
    console.log('🚀 Initializing auth system...')

    let isMounted = true

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Session error:', error)
          if (isMounted) {
            setUser(null)
            setIsAdmin(false)
            setIsLoading(false)
          }
          return
        }

        const currentUser = formatUser(session?.user ?? null)
        console.log('👤 Current user:', currentUser?.email || 'None')
        
        if (isMounted) {
          setUser(currentUser)
          
          if (currentUser) {
            const adminStatus = await checkIsAdmin(currentUser)
            setIsAdmin(adminStatus)
          } else {
            setIsAdmin(false)
          }
          
          setIsLoading(false)
        }
      } catch (err) {
        console.error('❌ Init error:', err)
        if (isMounted) {
          setUser(null)
          setIsAdmin(false)
          setIsLoading(false)
        }
      }
    }

    // Set up auth state listener
    console.log('📡 Setting up auth listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth event:', event)
      
      const currentUser = formatUser(session?.user ?? null)
      
      if (isMounted) {
        setUser(currentUser)
        
        if (currentUser) {
          const adminStatus = await checkIsAdmin(currentUser)
          setIsAdmin(adminStatus)
        } else {
          setIsAdmin(false)
        }
        
        setIsLoading(false)
      }

      // Handle successful sign in
      if (event === 'SIGNED_IN' && currentUser) {
        console.log('✅ User signed in:', currentUser.email)
        
        // Redirect if on login page
        if (typeof window !== 'undefined' && window.location.pathname === '/login') {
          console.log('📍 Redirecting to home...')
          setTimeout(() => {
            window.location.href = '/'
          }, 300)
        }
      }

      // Handle sign out
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out')
        
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    })

    authSubscription = subscription
    
    // Initialize
    initAuth()

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up...')
      isMounted = false
    }
  }, [])

  const signOut = async () => {
    console.log('🚪 Signing out...')
    
    setUser(null)
    setIsAdmin(false)
    
    try {
      await supabase.auth.signOut()
      
      // Clear storage
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key)
          }
        })
        sessionStorage.clear()
      }
      
      toast.success('Logged out successfully')
      
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    } catch (err) {
      console.error('Logout error:', err)
      toast.error('Logout failed')
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthContextProvider')
  return context
}