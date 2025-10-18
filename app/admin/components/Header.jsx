'use client';

import { Menu, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const getInitials = (name, email) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'A';
  };

  // Get user info from auth user object
  const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <section className='sticky top-0 z-50 flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 shadow-sm'>
      {/* Left Section - Menu Button */}
      <div className='flex items-center gap-4'>
        <button 
          onClick={toggleSidebar}
          className='md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors'
          aria-label="Toggle sidebar"
        >
          <Menu size={24} className='text-gray-700' />
        </button>
        <h1 className='text-2xl font-bold text-gray-800'>Dashboard</h1>
      </div>

      {/* Right Section - Admin Profile */}
      <div className='flex items-center gap-4'>
        {/* Admin Info */}
        <div className='hidden sm:flex flex-col items-end'>
          <p className='text-sm font-semibold text-gray-800'>
            {userName}
          </p>
          <p className='text-xs text-gray-500'>Administrator</p>
        </div>

        {/* Avatar with Dropdown */}
        <div className='relative' ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className='flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors'
            aria-label="Admin menu"
          >
            <div className='relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
              {userAvatar ? (
                <Image
                  src={userAvatar}
                  alt={userName}
                  fill
                  className='object-cover'
                  sizes='40px'
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center text-white font-semibold text-lg'>
                  {getInitials(userName, user?.email)}
                </div>
              )}
            </div>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className='absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50'>
              {/* Mobile: Show full info */}
              <div className='px-4 py-3 border-b border-gray-100 sm:hidden'>
                <p className='text-sm font-semibold text-gray-800'>
                  {userName}
                </p>
                <p className='text-xs text-gray-500 mt-0.5'>{user?.email}</p>
                <p className='text-xs text-gray-400 mt-1'>Administrator</p>
              </div>

              {/* Desktop: Just email */}
              <div className='hidden sm:block px-4 py-3 border-b border-gray-100'>
                <p className='text-xs text-gray-500'>{user?.email}</p>
              </div>
              
              <button
                onClick={handleLogout}
                className='w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors'
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Header