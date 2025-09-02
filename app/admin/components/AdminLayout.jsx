'use client';

import Sidebar from "./Sidebar";
import Header from "./Header";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }) {
  const [isOpen, setIsopen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsopen(!isOpen);
  };

  const sidebarRef = useRef(null);

  useEffect(() => {
    toggleSidebar();
  }, [pathname]);

  useEffect(() => {
    function handleClickOutsideEvent(event) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setIsopen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutsideEvent);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideEvent);
    };
  }, []);

  return (
    <main className="flex relative">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div
        ref={sidebarRef}
        className={`fixed md:hidden ${
          isOpen ? "translate-x-0 " : "-translate-x-[260px] "
        } ease-in-out transition-all duration-400`}
      >
        <Sidebar />
      </div>

      <section className="flex-1 flex flex-col min-h-screen">
        <Header toggleSidebar={toggleSidebar} />
        <section className="flex-1 bg-gray-200">{children}</section>
      </section>
    </main>
  );
}
