'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

const Header = () => {
  const { user, isAdmin, signOut } = useAuth()
  const router = useRouter()

  const menuList = [
    {
      name: "Home",
      link: "/"
    },
    {
      name: "About Us",
      link: "/about-us"
    },
    {
      name: "Contact Us",
      link: "/contact-us"
    }
  ]

  // Helper function to get initials from email
  const getInitials = (email) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  // Helper function to generate avatar color from email
  const getAvatarColor = (email) => {
    if (!email) return 'bg-gray-500'
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-orange-500',
    ]
    const index = email.charCodeAt(0) % colors.length
    return colors[index]
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className=''>
      <nav className='flex justify-between items-center py-4 px-14 border-b bg-white'>
        <Link href="/">
          <img src="/logo.png" alt="logo" className='h-10 cursor-pointer' />
        </Link>

        <div className='flex gap-4 items-center font-semibold'>
          {menuList?.map((item, index) => (
            <Link key={item?.id || index} href={item?.link}>
              <button className='hover:text-blue-600 transition-colors'>
                {item?.name}
              </button>
            </Link>
          ))}
        </div>

        <div className='flex items-center gap-3'>
          {user ? (
            <>
              {/* Admin Panel Button - Only show if user is admin */}
              {isAdmin && (
                <Link href='/admin'>
                  <button className='px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold transition-colors'>
                    Admin Panel
                  </button>
                </Link>
              )}

              {/* User Profile Circle with Email Initial */}
              <div className='flex items-center gap-2'>
                <div 
                  className={`w-10 h-10 rounded-full ${getAvatarColor(user?.email)} flex items-center justify-center text-white font-bold text-lg cursor-pointer`}
                  title={user?.email}
                >
                  {getInitials(user?.email)}
                </div>
              </div>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className='px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-colors'
              >
                Logout
              </button>
            </>
          ) : (
            /* Login Button - Only show if not logged in */
            <Link href='/login'>
              <button className='bg-blue-600 px-5 font-bold rounded-full py-2 text-white hover:bg-blue-700 transition-colors'>
                Login
              </button>
            </Link>
          )}
        </div>
      </nav>
    </div>
  )
}

export default Header