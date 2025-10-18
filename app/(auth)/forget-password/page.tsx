"use client";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@nextui-org/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (user) {
      router.push("/account");
    }
  }, [user, router]);

  const validateEmail = () => {
    if (!email?.trim()) {
      toast.error("Please enter your email");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSendEmail = async () => {
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      // Check if supabase is initialized
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        // Handle specific errors
        if (error.message.includes("not found")) {
          // For security, don't reveal if email exists
          toast.success("If that email exists, we've sent a reset link!");
          setEmailSent(true);
          setEmail("");
        } else {
          throw error;
        }
      } else {
        toast.success("Password reset link has been sent to your email!", {
          duration: 5000,
        });
        setEmailSent(true);
        setEmail("");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error(error?.message || "Failed to send reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full flex justify-center items-center bg-gray-300 md:p-24 p-10 min-h-screen">
      <section className="flex flex-col gap-3">
        <div className="flex justify-center">
          <img 
            className="h-12" 
            src="/logo.png" 
            alt="Logo"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        </div>
        <div className="flex flex-col gap-3 bg-white md:p-10 p-5 rounded-xl md:min-w-[440px] w-full">
          <h1 className="font-bold text-xl">Forgot Password</h1>
          <p className="text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {emailSent ? (
            <div className="flex flex-col gap-4 py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium mb-2">
                  ✓ Reset link sent successfully!
                </p>
                <p className="text-xs text-green-700">
                  Check your email inbox and spam folder. The link will expire in 1 hour.
                </p>
              </div>
              <div className="flex flex-col gap-2 text-sm text-gray-600">
                <p>Didn't receive the email?</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Check your spam/junk folder</li>
                  <li>Make sure you entered the correct email</li>
                  <li>Wait a few minutes and try again</li>
                </ul>
              </div>
              <Button
                onClick={() => setEmailSent(false)}
                color="primary"
                variant="light"
              >
                Try Another Email
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendEmail();
              }}
              className="flex flex-col gap-3"
            >
              <input
                placeholder="Enter Your Email"
                type="email"
                name="user-email"
                id="user-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-3 py-2 rounded-xl border focus:outline-none w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isLoading}
                required
              />
              <Button
                isLoading={isLoading}
                isDisabled={isLoading}
                type="submit"
                color="primary"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}

          <div className="flex justify-between mt-2">
            <Link href="/login">
              <button className="font-semibold text-sm text-blue-700 hover:text-blue-800 transition">
                Back to Sign In
              </button>
            </Link>
            <Link href="/sign-up">
              <button className="font-semibold text-sm text-blue-700 hover:text-blue-800 transition">
                Create Account
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}