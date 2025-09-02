import React from 'react'
import Link from 'next/link'
const Header = () => {

    const menuList=[
        {
            name:"Home",
            link:"/"
        },
        {
            name:"About Us",
            link:"/about-us"
        },
        {
            name:"Contact Us",
            link:"contact-us"
        }
    ]
  return (
    <div className=''>
      <nav className='flex justify-between items-center py-4 px-14 border-b'>
        <img src="./logo.png" alt="logo" />
        <div className='flex gap-4 items-center font-semibold'>
            {
                menuList?.map((item, index) => {
                return (
                    <Link key={item?.id || index} href={item?.link} className=''>
                    <button>{item?.name}</button>
                    </Link>
                )
                })
            }
        </div>
        <div>
            {/* svgs */}
            <Link href={'/login'}>
                <button className='bg-blue-600 px-5 font-bold rounded-full py-1 text-white'>Login</button>
            </Link>
        </div>
      </nav>
    </div>
  )
}

export default Header
