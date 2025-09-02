import { Menu } from 'lucide-react'
import React from 'react'

const Header = ({toggleSidebar}) => {
  return (
    <section className='flex items-center gap-3 bg-white border-b px-4 py-3'>
        <div className='flex justify-center items-center md:hidden'>
            <button onClick={toggleSidebar}>
                <Menu/>
            </button>
        </div>
        <h1 className='text-xl font-semibold'>Dashboard</h1>
    </section>
  )
}

export default Header
