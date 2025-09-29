'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CatIcon, Layers2, LayoutDashboard, LibraryBig, LogOut, PackageOpen, ShieldCheck, ShoppingCart, Star, User } from "lucide-react"
import { usePathname } from "next/navigation"
import toast from "react-hot-toast"
import { supabase } from '@/lib/supabaseClient'  // 👈 use your Supabase client

export default function Sidebar() {
  const menuList = [
    {
      name: "Dashboard",
      link: "/admin",
      icon: <LayoutDashboard className="h-5" />
    },
    {
      name: "Products",
      link: "/admin/products",
      icon: <PackageOpen className="h-5" />
    },
    {
      name: "Categories",
      link: "/admin/categories",
      icon: <Layers2 className="h-5" />
    },
    {
      name: "Brands",
      link: "/admin/brands",
      icon: <CatIcon className="h-5" />
    },
    {
      name: "Orders",
      link: "/admin/orders",
      icon: <ShoppingCart className="h-5" />
    },
    {
      name: "Customers",
      link: "/admin/customers",
      icon: <User className="h-5" />
    },
    {
      name: "Reviews",
      link: "/admin/reviews",
      icon: <Star className="h-5" />
    },
    {
      name: "Collections",
      link: "/admin/collections",
      icon: <LibraryBig className="h-5" />
    },
    {
      name: "Admins",
      link: "/admin/admins",
      icon: <ShieldCheck className="h-5" />
    }
  ]

  return (
    <section className="flex flex-col gap-3 items-center bg-white border-r px-5 py-3 overflow-hidden h-screen w-[220px]">
      <img className="h-8 mt-2" src="./logo.png" alt="logo" />
      <ul className="flex-1 h-full overflow-y-auto py-2 flex flex-col gap-3 scrollbar-hide">
        {menuList.map((item, index) => (
          <Tab key={index} item={item} />
        ))}
      </ul>
      <div className="flex justify-center w-full">
        <Button
          onClick={async ()=>{
            try{
              const { error } = await supabase.auth.signOut(); // 👈 Supabase sign out
              if (error) throw error;

              toast.success("Successfully logged out");
            }catch(err){
              toast.error(err?.message);
            }
          }}
          variant="ghost"
          className="flex gap-2 items-center hover:bg-indigo-100 px-3 py-2 w-full ease-soft-spring transition-all duration-300"
        >
          <LogOut className="h-5" /> logout
        </Button>
      </div>
    </section>
  )
}

function Tab({ item }) {
  const pathname = usePathname()
  const isSelected = pathname === item?.link

  return (
    <li>
      <Link
        href={item?.link}
        className={`w-full flex gap-2 px-4 py-2 items-center rounded-xl font-semibold ease-soft-spring transition-all duration-300 ${
          isSelected ? "bg-blue-400 text-white" : "bg-white text-black"
        }`}
      >
        {item?.icon} {item?.name}
      </Link>
    </li>
  )
}
