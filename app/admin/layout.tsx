'use client'

import AuthContextProvider from '@/contexts/AuthContext'
import AdminLayout from './components/AdminLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
const layout = ({children}:any) => {
  return (
    <AuthContextProvider>
        <AdminChecking>{children}</AdminChecking>
    </AuthContextProvider>
  )
}

function AdminChecking({children}){
    const {user,isLoading}=useAuth();
    const router=useRouter();

    useEffect(()=>{
        if(!user && !isLoading){
            router.push("/login")
        }
    },[user,isLoading]);
    if(isLoading){
        return(
            <div className='h-screen w-screen flex justify-center items-center'>
                <Loader2/>
            </div>
        )
    }

    if(!user){
        return(
            <div className='h-screen w-screen flex justify-center items-center'>
                <h1 className='capitalize'>Please login first!</h1>
            </div>
        )

    }

    return <AdminLayout>{children}</AdminLayout>

}

export default layout
