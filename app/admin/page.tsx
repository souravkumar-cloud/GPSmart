'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login')
      } else if (user.email !== 'sokukumar678@gmail.com') {
        router.push('/dashboard')
      }
    }
  }, [user, isLoading, router])

  if (isLoading || !user) return <p>Loading...</p>

  return <div>Welcome Admin: {user.email}</div>
}
