'use client'


import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { GoogleAuthProvider } from 'firebase/auth'
import { signInWithPopup } from 'firebase/auth'
import {auth} from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const page = () => {
    const {user}=useAuth();
    const router=useRouter();

    useEffect(()=>{
        if(user){
            router.push("/dashboard");
        }
    },[user])
  return (
    <main className='w-full flex justify-center items-center bg-gray-300 md:p-24 p-10 min-h-screen'>
        <section>
            <div className='flex justify-center'>
                <img className='h-12' src="./logo" alt="logo" />
            </div>
            <div className='flex flex-col gap-3 bg-white md:p-10 p-5 rounded-xl md:min-w-[440px] w-full'>
                <h1 className='flex justify-center font-bold text-xl'>Login with Email</h1>
                <form action="" className='flex flex-col gap-3'>
                    <input 
                    type="email"
                    placeholder='Enter Your Email'
                    name="user-email"
                    id="user-email"
                    className='px-3 py-2 rounded-lg border focus:outline-none w-full' />{" "}

                    <input 
                    type="password"
                    placeholder='Enter Your Password'
                    name="user-password"
                    id="user-password"
                    className='px-3 py-2 rounded-lg border focus:outline-none w-full' /> 

                    <Button >Login</Button>
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
                <SignInWithGoogleComponents/>
            </div>
        </section>
    </main>
  )
}

export default page

function SignInWithGoogleComponents(){
    const [isLoading, setIsLoading]=useState(false);
    const handleLogin=async ()=>{
        setIsLoading(true);
        try{
            const user=await signInWithPopup(auth,new GoogleAuthProvider());
        }catch(err){
            toast.error(err?.message)
            console.log(err);
        }
        setIsLoading(false);
    }
    return(
        <div className='flex justify-center'>
            <Button  onClick={handleLogin} className='bg-gray-400 font-extrabold w-full hover:bg-gray-500' size='lg'>Sign in with google</Button>
        </div>
    );
}
