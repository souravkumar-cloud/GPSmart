'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, usePathname } from 'next/navigation'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

// Check if user is admin by querying the admins table
const checkIsAdmin = async (user) => {
  if (!user?.email) return false
  
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('email')
      .eq('email', user.email.toLowerCase())
      .single()
    
    if (error) {
      console.log('Not an admin:', error.message)
      return false
    }
    
    return !!data
  } catch (err) {
    console.error('Error checking admin status:', err)
    return false
  }
}

export default function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  // Use ref to track logout state (doesn't cause re-renders)
  const isSigningOutRef = useRef(false)

  // Format user data to include photoURL from Supabase
  const formatUser = (supabaseUser) => {
    if (!supabaseUser) return null
    
    return {
      ...supabaseUser,
      photoURL: supabaseUser?.user_metadata?.avatar_url || null,
    }
  }

  useEffect(() => {
    let isMounted = true

    // Get initial session
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          if (isMounted) {
            setUser(null)
            setIsAdmin(false)
            setIsLoading(false)
          }
          return
        }

        if (!isMounted) return
        
        const currentUser = formatUser(data.session?.user ?? null)
        setUser(currentUser)
        
        const adminStatus = await checkIsAdmin(currentUser)
        if (!isMounted) return
        
        setIsAdmin(adminStatus)
        setIsLoading(false)

        // Clean up URL hash after successful auth
        if (data.session && window.location.hash) {
          const cleanUrl = window.location.pathname + window.location.search
          window.history.replaceState(null, '', cleanUrl)
          
          // Redirect to home page after login
          if (pathname === '/login') {
            router.replace('/')
          }
        }
      } catch (err) {
        console.error('Unexpected error getting session:', err)
        if (isMounted) {
          setUser(null)
          setIsAdmin(false)
          setIsLoading(false)
        }
      }
    }

    getSession()

    // Listen to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      console.log('Auth event:', event, 'Signing out:', isSigningOutRef.current)
      
      // CRITICAL: Ignore SIGNED_IN events during logout
      if (event === 'SIGNED_IN' && isSigningOutRef.current) {
        console.log('🚫 Ignoring SIGNED_IN event during logout')
        return
      }
      
      const currentUser = formatUser(session?.user ?? null)
      
      // Only update state if not signing out
      if (!isSigningOutRef.current) {
        setUser(currentUser)
        
        const adminStatus = currentUser ? await checkIsAdmin(currentUser) : false
        if (!isMounted) return
        
        setIsAdmin(adminStatus)
        setIsLoading(false)

        // Handle successful sign in - redirect to home page
        if (event === 'SIGNED_IN' && currentUser) {
          if (window.location.hash) {
            const cleanUrl = window.location.pathname + window.location.search
            window.history.replaceState(null, '', cleanUrl)
          }
          
          // Always redirect to home page after login
          if (pathname === '/login') {
            console.log('Redirecting to home page')
            router.replace('/')
          }
        }
      }

      // Handle sign out
      if (event === 'SIGNED_OUT') {
        console.log('✅ SIGNED_OUT event received')
        setUser(null)
        setIsAdmin(false)
        isSigningOutRef.current = false
        
        if (pathname !== '/login') {
          router.replace('/login')
        }
      }

      // Handle token refresh
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
      }
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [router, pathname])

  const signOut = async () => {
    console.log('🚪 Starting logout process...')
    
    // Set flag IMMEDIATELY to prevent race conditions
    isSigningOutRef.current = true
    
    // Clear local state first
    setUser(null)
    setIsAdmin(false)
    
    try {
      // IMPORTANT: Use scope 'local' to avoid 403 errors
      console.log('Attempting local logout...')
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      
      if (error) {
        console.warn('Logout error (expected if session expired):', error)
      } else {
        console.log('✅ Logout successful')
      }
      
    } catch (err) {
      console.error('Logout exception:', err)
    }
    
    // ALWAYS clear storage manually as backup
    try {
      // Clear all Supabase storage keys
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      sessionStorage.clear()
      console.log('✅ Storage cleared')
    } catch (storageErr) {
      console.warn('Could not clear storage:', storageErr)
    }
    
    // Show success message
    toast.success('Logged out successfully')
    
    // Force navigation
    router.replace('/login')
    
    // Reset flag after delay
    setTimeout(() => {
      isSigningOutRef.current = false
      console.log('✅ Logout process complete')
    }, 1000)
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