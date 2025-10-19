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

  // Debug: Log auth state changes
  useEffect(() => {
    console.log('🔍 Login Page - User:', user ? 'Logged in' : 'Not logged in', 'Loading:', isLoading)
  }, [user, isLoading])

  // Simple redirect - only when we're sure user is logged in
  useEffect(() => {
    if (user && !isLoading) {
      console.log('✅ User detected, redirecting to home...')
      router.replace('/')
    }
  }, [user, isLoading, router])

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both email and password')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoadingBtn(true)
    console.log('🔐 Attempting login...')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      })
      
      console.log('📊 Login response:', { data, error })
      
      if (error) {
        console.error('❌ Login error:', error)
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password')
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please verify your email before logging in')
        } else {
          toast.error(error.message)
        }
        setLoadingBtn(false)
        return
      }

      if (data?.user) {
        console.log('✅ Login successful, user:', data.user.email)
        console.log('⏳ Waiting for auth state to update...')
        toast.success('Logged in successfully!')
        // Auth context will handle the redirect
      } else {
        console.warn('⚠️ No user in response data')
        setLoadingBtn(false)
      }
    } catch (err) {
      console.error('❌ Login exception:', err)
      toast.error('Login failed. Please try again.')
      setLoadingBtn(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoadingBtn(true)
    console.log('🔐 Initiating Google login...')
    
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
          redirectTo: `${origin}/`,
        },
      })
      
      if (error) {
        console.error('❌ Google login error:', error)
        toast.error(error.message)
        setLoadingBtn(false)
      }
    } catch (err) {
      console.error('❌ Google login exception:', err)
      toast.error('Failed to initiate Google login')
      setLoadingBtn(false)
    }
  }

  // Show loading while checking initial auth state
  if (isLoading) {
    console.log('⏳ Showing loading screen...')
    return (
      <main className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    )
  }

  // If user is already logged in, show redirecting message
  if (user) {
    console.log('👤 User already logged in, showing redirect screen...')
    return (
      <main className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Redirecting...</p>
          </div>
        </div>
      </main>
    )
  }

  console.log('📝 Showing login form...')
  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-50 p-5">
      <div className="bg-white p-8 rounded-xl w-full max-w-md flex flex-col gap-4 shadow-lg">
        <div className="flex justify-center mb-2">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-12"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        </div>
        
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to continue to your account
          </p>
        </div>

        <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loadingBtn}
              className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loadingBtn}
              className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <Button 
            type="submit" 
            disabled={loadingBtn}
            className="w-full mt-2"
          >
            {loadingBtn ? 'Logging in...' : 'Login with Email'}
          </Button>
        </form>

        <div className="relative flex items-center gap-2 my-2">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="text-sm text-gray-500 px-2">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <Button 
          onClick={handleGoogleLogin} 
          disabled={loadingBtn} 
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-2 hover:bg-gray-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loadingBtn ? 'Signing in...' : 'Continue with Google'}
        </Button>

        <p className="text-xs text-center text-gray-500 -mt-1">
          Select your Google account to continue
        </p>

        <div className="flex justify-between text-sm mt-4 pt-4 border-t border-gray-200">
          <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 font-medium transition">
            Create Account
          </Link>
          <Link href="/forget-password" className="text-blue-600 hover:text-blue-700 font-medium transition">
            Forgot Password?
          </Link>
        </div>
      </div>
    </main>
  )
}