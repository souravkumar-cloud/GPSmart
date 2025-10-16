'use client'

import AuthContextProvider, { useAuth } from '@/contexts/AuthContext'
import AdminLayout from './components/AdminLayout'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

const Layout = ({ children }) => {
  return (
    <AuthContextProvider>
      <AdminChecking>{children}</AdminChecking>
    </AuthContextProvider>
  )
}

function AdminChecking({ children }) {
  const { user, isLoading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in - redirect to login
        router.replace('/login')
      } else if (!isAdmin) {
        // Logged in but not admin - redirect to dashboard
        router.replace('/dashboard')
      }
    }
  }, [user, isLoading, isAdmin, router])

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex justify-center items-center">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    )
  }

  // Prevent flash before redirect
  if (!user || !isAdmin) return null

  return <AdminLayout>{children}</AdminLayout>
}

export default Layout