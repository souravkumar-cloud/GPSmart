"use client";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@nextui-org/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Page() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (user) {
      router.push("/account");
    }
  }, [user, router]);

  const handleData = (key, value) => {
    setData({
      ...data,
      [key]: value,
    });
  };

  const validateForm = () => {
    if (!data?.name?.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (!data?.email?.trim()) {
      toast.error("Please enter your email");
      return false;
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data?.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!data?.password?.trim()) {
      toast.error("Please enter a password");
      return false;
    }
    if (data.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Check if supabase is initialized
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      // Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data?.email,
        password: data?.password,
        options: {
          data: {
            full_name: data?.name,
          },
          // Optional: Add email redirect URL for confirmation
          // emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        // Handle specific error cases
        if (authError.message.includes("already registered")) {
          toast.error("This email is already registered. Please login instead.");
        } else {
          toast.error(authError.message);
        }
        return;
      }

      if (!authData?.user) {
        toast.error("Sign up failed. Please try again.");
        return;
      }

      // Store additional user data in your users table
      // This is synced with Supabase Auth
      const { error: dbError } = await supabase
        .from("users")
        .insert([
          {
            id: authData.user.id, // Use the auth user ID
            email: data?.email,
            full_name: data?.name,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (dbError) {
        // Handle duplicate entry (user already exists in table)
        if (dbError.code === "23505") {
          console.log("User already exists in users table");
        } else {
          console.error("Database error:", dbError);
          // Don't throw - user is already created in auth
          toast.error("Account created but profile setup incomplete. Please contact support.");
          return;
        }
      }

      // Check if email confirmation is required
      if (authData.user && !authData.session) {
        toast.success(
          "Sign up successful! Please check your email to verify your account.",
          { duration: 5000 }
        );
      } else {
        toast.success("Sign up successful! Redirecting...");
      }

      // Clear form
      setData({ name: "", email: "", password: "" });
      
      // Redirect to login page
      setTimeout(() => {
        router.push("/login");
      }, 1500);

    } catch (error) {
      console.error("Sign up error:", error);
      toast.error(error?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full flex justify-center items-center bg-gray-300 md:p-24 p-10 min-h-screen">
      <section className="flex flex-col gap-3">
        <div className="flex justify-center">
          <img className="h-12" src="/logo.png" alt="Logo" />
        </div>
        <div className="flex flex-col gap-3 bg-white md:p-10 p-5 rounded-xl md:min-w-[440px] w-full">
          <h1 className="font-bold text-xl">Sign Up With Email</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSignUp();
            }}
            className="flex flex-col gap-3"
          >
            <input
              placeholder="Enter Your Name"
              type="text"
              name="user-name"
              id="user-name"
              value={data?.name}
              onChange={(e) => {
                handleData("name", e.target.value);
              }}
              className="px-3 py-2 rounded-xl border focus:outline-none w-full"
              disabled={isLoading}
              required
            />
            <input
              placeholder="Enter Your Email"
              type="email"
              name="user-email"
              id="user-email"
              value={data?.email}
              onChange={(e) => {
                handleData("email", e.target.value);
              }}
              className="px-3 py-2 rounded-xl border focus:outline-none w-full"
              disabled={isLoading}
              required
            />
            <input
              placeholder="Enter Your Password (min. 6 characters)"
              type="password"
              name="user-password"
              id="user-password"
              value={data?.password}
              onChange={(e) => {
                handleData("password", e.target.value);
              }}
              className="px-3 py-2 rounded-xl border focus:outline-none w-full"
              disabled={isLoading}
              required
              minLength={6}
            />
            <Button
              isLoading={isLoading}
              isDisabled={isLoading}
              type="submit"
              color="primary"
            >
              Sign Up
            </Button>
          </form>
          <div className="flex justify-between">
            <Link href={`/login`}>
              <button className="font-semibold text-sm text-blue-700">
                Already a user? Sign In
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}