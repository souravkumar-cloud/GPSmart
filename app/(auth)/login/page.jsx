'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LoginPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loadingBtn, setLoadingBtn] = useState(false)

  // Redirect logged-in users
  useEffect(() => {
    if (!isLoading && user) {
      if (user.email === 'sokukumar678@gmail.com') router.push('/admin')
      else router.push('/dashboard')
    }
  }, [user, isLoading, router])

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setLoadingBtn(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) toast.error(error.message)
    else toast.success('Logged in successfully!')
    setLoadingBtn(false)
  }

  const handleGoogleLogin = async () => {
    setLoadingBtn(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) toast.error(error.message)
    setLoadingBtn(false)
  }

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-200 p-5">
      <div className="bg-white p-8 rounded-xl w-full max-w-md flex flex-col gap-4">
        <div className="flex justify-center">
          <img src="/logo.png" alt="Logo" className="h-12" />
        </div>
        <h1 className="text-xl font-bold text-center">Login</h1>

        <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border px-3 py-2 rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border px-3 py-2 rounded"
          />
          <Button type="submit" disabled={loadingBtn}>
            {loadingBtn ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <Button onClick={handleGoogleLogin} disabled={loadingBtn} variant="secondary">
          {loadingBtn ? 'Signing in...' : 'Login with Google'}
        </Button>

        <div className="flex justify-between text-sm mt-2">
          <Link href="/sign-up" className="text-blue-700 font-semibold">
            Create Account
          </Link>
          <Link href="/forget-password" className="text-blue-700 font-semibold">
            Forget Password?
          </Link>
        </div>
      </div>
    </main>
  )
}
