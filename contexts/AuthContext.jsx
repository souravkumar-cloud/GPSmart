'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, usePathname } from 'next/navigation'

const AuthContext = createContext(null)

// ✅ Check if user is admin by querying the admins table
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
    
    return !!data // Returns true if admin record exists
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

  useEffect(() => {
    let isMounted = true

    // Get initial session
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      
      const currentUser = data.session?.user ?? null
      setUser(currentUser)
      
      // ✅ Check admin status from database
      const adminStatus = await checkIsAdmin(currentUser)
      if (!isMounted) return
      
      setIsAdmin(adminStatus)
      setIsLoading(false)

      // ✅ Clean up URL hash after successful auth
      if (data.session && window.location.hash) {
        const cleanUrl = window.location.pathname + window.location.search
        window.history.replaceState(null, '', cleanUrl)
        
        // ✅ Redirect based on role
        if (pathname === '/login' || pathname === '/') {
          const destination = adminStatus ? '/admin' : '/dashboard'
          router.replace(destination)
        }
      }
    }

    getSession()

    // Listen to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      console.log('Auth event:', event) // For debugging
      
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      // ✅ Check admin status from database
      const adminStatus = await checkIsAdmin(currentUser)
      if (!isMounted) return
      
      setIsAdmin(adminStatus)
      setIsLoading(false)

      // ✅ Handle successful sign in
      if (event === 'SIGNED_IN') {
        // Clean up hash from URL
        if (window.location.hash) {
          const cleanUrl = window.location.pathname + window.location.search
          window.history.replaceState(null, '', cleanUrl)
        }
        
        // ✅ Redirect based on role
        if (pathname === '/login' || pathname === '/') {
          const destination = adminStatus ? '/admin' : '/dashboard'
          console.log('Redirecting to:', destination, 'isAdmin:', adminStatus)
          router.replace(destination)
        }
      }

      // ✅ Handle sign out
      if (event === 'SIGNED_OUT') {
        setIsAdmin(false)
        router.replace('/login')
      }

      // ✅ Handle token refresh
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
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
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