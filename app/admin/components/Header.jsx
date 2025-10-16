import { Menu, LogOut, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmins } from '@/lib/supabase/admins/read'
import { Avatar } from '@nextui-org/react'
import React, { useState, useMemo } from 'react'

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { data: allAdmins, isLoading } = useAdmins();
  const [showDropdown, setShowDropdown] = useState(false);

  // Find current admin by email
  const admin = useMemo(() => {
    if (!allAdmins || !user?.email) return null;
    return allAdmins.find(a => a.email === user.email);
  }, [allAdmins, user?.email]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <section className='sticky top-0 z-50 flex items-center justify-between bg-white border-b border-gray-200 px-4 shadow-sm'>
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
          {isLoading ? (
            <div className='flex gap-2 items-center'>
              <Loader2 size={16} className='animate-spin text-gray-500' />
            </div>
          ) : (
            <>
              <p className='text-sm font-semibold text-gray-800'>
                {admin?.name || user?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className='text-xs text-gray-500'>Administrator</p>
            </>
          )}
        </div>

        {/* Avatar with Dropdown */}
        <div className='relative'>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className='flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors'
            aria-label="Admin menu"
          >
            <Avatar 
              src={admin?.imageURL}
              name={admin?.name || user?.email}
              size='md'
              className='cursor-pointer'
            />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className='absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50'>
              <div className='px-4 py-3 border-b border-gray-100'>
                <p className='text-sm font-semibold text-gray-800'>
                  {admin?.name || user?.email?.split('@')[0] || 'Admin'}
                </p>
                <p className='text-xs text-gray-500'>{user?.email}</p>
              </div>
              
              <button
                onClick={handleLogout}
                className='w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors'
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