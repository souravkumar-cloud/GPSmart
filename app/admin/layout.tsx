'use client'

import AuthContextProvider, { useAuth } from '@/contexts/AuthContext'
import AdminLayout from './components/AdminLayout'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

const Layout = ({ children }: any) => {
  return (
    <AuthContextProvider>
      <AdminChecking>{children}</AdminChecking>
    </AuthContextProvider>
  )
}

function AdminChecking({ children }: any) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')   // only block non-logged users
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex justify-center items-center">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    )
  }

  if (!user) return null // prevent flash before redirect

  return <AdminLayout>{children}</AdminLayout>
}

export default Layout
