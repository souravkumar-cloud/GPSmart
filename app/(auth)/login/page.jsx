'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const Page = () => {
    const { user } = useAuth()
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    useEffect(() => {
        if (user) {
            if (user.email === "sokukumar678@gmail.com") {
                router.push("/admin")
            } else {
                router.push("/dashboard")
            }
        }
    }, [user, router])


    const handleEmailLogin = async (e) => {
        e.preventDefault()
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            toast.error(error.message)
        } else {
            toast.success("Logged in successfully!")
        }
    }

    return (
        <main className='w-full flex justify-center items-center bg-gray-300 md:p-24 p-10 min-h-screen'>
            <section>
                <div className='flex justify-center'>
                    <img className='h-12' src="./logo" alt="logo" />
                </div>
                <div className='flex flex-col gap-3 bg-white md:p-10 p-5 rounded-xl md:min-w-[440px] w-full'>
                    <h1 className='flex justify-center font-bold text-xl'>Login with Email</h1>
                    <form onSubmit={handleEmailLogin} className='flex flex-col gap-3'>
                        <input 
                            type="email"
                            placeholder='Enter Your Email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className='px-3 py-2 rounded-lg border focus:outline-none w-full' 
                        />

                        <input 
                            type="password"
                            placeholder='Enter Your Password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className='px-3 py-2 rounded-lg border focus:outline-none w-full' 
                        /> 

                        <Button type='submit'>Login</Button>
                    </form>
                    <div className='flex justify-between'>
                        <Link href="/sign-up">
                            <Button size='sm' variant='link' className='text-blue-800'>Create Account</Button>
                        </Link>
                        <Link href="/forget-password">
                            <Button size='sm' variant='link' className='text-blue-800'>Forget Password?</Button>
                        </Link>
                    </div>
                    <hr />
                    <SignInWithGoogleComponents />
                </div>
            </section>
        </main>
    )
}

export default Page

function SignInWithGoogleComponents() {
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async () => {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google'
            })
            if (error) throw error
        } catch (err) {
            toast.error(err?.message)
            console.log(err)
        }
        setIsLoading(false)
    }

    return (
        <div className='flex justify-center'>
            <Button 
                onClick={handleLogin} 
                className='bg-gray-400 font-extrabold w-full hover:bg-gray-500' 
                size='lg'
                disabled={isLoading}
            >
                {isLoading ? "Signing in..." : "Sign in with Google"}
            </Button>
        </div>
    )
}
