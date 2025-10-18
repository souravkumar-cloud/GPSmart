"use client";

import { useAuth } from "@/contexts/AuthContext";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import Link from "next/link";

export default function Layout({ children }) {
  return (
    <main>
      <Header />
      <UserChecking>
        <section className="min-h-screen">{children}</section>
      </UserChecking>
      <Footer />
    </main>
  );
}

function UserChecking({ children }) {
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen w-full flex justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col gap-4 justify-center items-center px-4">
        <div className="text-center">
          <svg 
            className="w-20 h-20 mx-auto mb-4 text-gray-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Authentication Required
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            You need to be logged in to access this page.
          </p>
        </div>
        <Link href="/login">
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md">
            Login to Continue
          </button>
        </Link>
        <Link href="/">
          <button className="text-sm text-gray-600 hover:text-gray-800 underline">
            Go back to home
          </button>
        </Link>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}