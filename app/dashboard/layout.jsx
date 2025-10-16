'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({ children }) {
  const { user, isLoading, isAdmin, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in - redirect to login
        router.replace('/login')
      } else if (isAdmin) {
        // Admin users should use admin panel
        router.replace('/admin')
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
  if (!user || isAdmin) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}