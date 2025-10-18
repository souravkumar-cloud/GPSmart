"use client";

import { supabase } from "@/lib/supabaseClient";
import { Button } from "@nextui-org/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isValidToken, setIsValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [email, setEmail] = useState("");
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    const checkRecoveryToken = async () => {
      // Add timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.log("⏰ Token check timeout - showing email prompt");
        setCheckingToken(false);
        setIsValidToken(false);
        setShowEmailPrompt(true);
      }, 5000); // 5 second timeout

      try {
        // Get URL parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        // Debug info
        const debug = {
          fullURL: window.location.href,
          hash: window.location.hash,
          search: window.location.search,
          access_token: hashParams.get('access_token') || queryParams.get('access_token'),
          token: hashParams.get('token') || queryParams.get('token'),
          type: hashParams.get('type') || queryParams.get('type'),
          error: hashParams.get('error') || queryParams.get('error'),
        };
        
        setDebugInfo(debug);
        console.log("🔍 Reset Password Debug:", debug);

        // Clear timeout since we're processing
        clearTimeout(timeout);

        // Check for errors first
        if (debug.error) {
          console.error("URL contains error:", debug.error);
          
          if (debug.error === 'access_denied') {
            toast.error("This reset link has expired or is invalid. Please request a new one.", {
              duration: 5000,
            });
          }
          
          setIsValidToken(false);
          setShowEmailPrompt(true);
          setCheckingToken(false);
          return;
        }

        // Check for access_token (most common format from Supabase)
        if (debug.access_token && debug.type === 'recovery') {
          console.log("✅ Found access_token, setting session...");
          
          const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token') || '';
          
          const { data, error } = await supabase.auth.setSession({
            access_token: debug.access_token,
            refresh_token: refreshToken,
          });

          console.log("Session result:", { data, error });

          if (error) {
            console.error("❌ Session error:", error);
            toast.error("Failed to verify reset link. Please request a new one.");
            setIsValidToken(false);
            setShowEmailPrompt(true);
            setCheckingToken(false);
          } else if (data.session) {
            console.log("✅ Session set successfully!");
            toast.success("Link verified! Please enter your new password.");
            setIsValidToken(true);
            setShowEmailPrompt(false);
            setCheckingToken(false);
          } else {
            console.log("⚠️ No session in response");
            setIsValidToken(false);
            setShowEmailPrompt(true);
            setCheckingToken(false);
          }
        } 
        // Check for regular token
        else if (debug.token && debug.type === 'recovery') {
          console.log("✅ Found token, verifying OTP...");
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: debug.token,
            type: 'recovery',
          });

          console.log("OTP result:", { data, error });

          if (error) {
            console.error("❌ OTP verification error:", error);
            toast.error("Failed to verify reset link. Please request a new one.");
            setIsValidToken(false);
            setShowEmailPrompt(true);
            setCheckingToken(false);
          } else if (data.session) {
            console.log("✅ OTP verified successfully!");
            toast.success("Link verified! Please enter your new password.");
            setIsValidToken(true);
            setShowEmailPrompt(false);
            setCheckingToken(false);
          } else {
            console.log("⚠️ No session in OTP response");
            setIsValidToken(false);
            setShowEmailPrompt(true);
            setCheckingToken(false);
          }
        }
        // No token found - show email prompt
        else {
          console.log("⚠️ No token found in URL");
          
          // Check if there's already an active session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            console.log("✅ Found active session");
            setIsValidToken(true);
            setShowEmailPrompt(false);
            setCheckingToken(false);
          } else {
            console.log("❌ No active session, showing email prompt");
            setIsValidToken(false);
            setShowEmailPrompt(true);
            setCheckingToken(false);
          }
        }
      } catch (err) {
        console.error("❌ Error checking token:", err);
        toast.error("An error occurred. Please try again.");
        setIsValidToken(false);
        setShowEmailPrompt(true);
        setCheckingToken(false);
      }
    };

    // Run the check
    checkRecoveryToken();
  }, []);

  const validatePassword = () => {
    if (!password?.trim()) {
      toast.error("Please enter a new password");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    if (!validatePassword()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("Password updated successfully! Redirecting to login...", {
        duration: 3000,
      });
      
      await supabase.auth.signOut();
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error(error?.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!email?.trim()) {
      toast.error("Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      toast.success("Password reset link has been sent to your email!", {
        duration: 5000,
      });
      setEmail("");
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error(error?.message || "Failed to send reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (checkingToken) {
    return (
      <main className="w-full flex justify-center items-center bg-gray-300 min-h-screen p-10">
        <div className="bg-white p-8 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Verifying reset link...</p>
          </div>
        </div>
      </main>
    );
  }

  // Email prompt (no valid token)
  if (showEmailPrompt && !isValidToken) {
    return (
      <main className="w-full flex justify-center items-center bg-gray-300 md:p-24 p-10 min-h-screen">
        <section className="flex flex-col gap-3">
          <div className="flex justify-center">
            <img 
              className="h-12" 
              src="/logo.png" 
              alt="Logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <div className="flex flex-col gap-4 bg-white md:p-10 p-5 rounded-xl md:min-w-[440px] w-full">
            <h1 className="font-bold text-xl text-orange-600">Reset Link Required</h1>
            <p className="text-sm text-gray-600">
              To reset your password, please enter your email address. We'll send you a secure link.
            </p>
            
            {/* Debug info - Remove in production */}
            {debugInfo && (
              <details className="text-xs bg-gray-100 p-3 rounded">
                <summary className="cursor-pointer font-semibold mb-2">
                  🔍 Debug Info (Click to see what's in the URL)
                </summary>
                <pre className="overflow-auto text-xs mt-2">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
                <p className="text-red-600 mt-2 font-semibold">
                  ⚠️ Problem: No token found in URL. Check Supabase email template!
                </p>
              </details>
            )}
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendResetEmail();
              }}
              className="flex flex-col gap-3"
            >
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Email Address
                </label>
                <input
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-3 py-2 rounded-xl border focus:outline-none w-full disabled:bg-gray-100"
                  disabled={isLoading}
                  required
                />
              </div>
              <Button
                isLoading={isLoading}
                isDisabled={isLoading}
                type="submit"
                color="primary"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="flex justify-between text-sm mt-2">
              <Link href="/login">
                <button className="font-semibold text-blue-700 hover:text-blue-800">
                  Back to Sign In
                </button>
              </Link>
              <Link href="/forget-password">
                <button className="font-semibold text-blue-700 hover:text-blue-800">
                  Forgot Password?
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // Password reset form (valid token)
  return (
    <main className="w-full flex justify-center items-center bg-gray-300 md:p-24 p-10 min-h-screen">
      <section className="flex flex-col gap-3">
        <div className="flex justify-center">
          <img 
            className="h-12" 
            src="/logo.png" 
            alt="Logo"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
        <div className="flex flex-col gap-3 bg-white md:p-10 p-5 rounded-xl md:min-w-[440px] w-full">
          <h1 className="font-bold text-xl">Reset Your Password</h1>
          <p className="text-sm text-gray-600">
            Enter your new password below.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleResetPassword();
            }}
            className="flex flex-col gap-3"
          >
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                New Password
              </label>
              <input
                placeholder="Enter new password (min. 6 characters)"
                type="password"
                name="new-password"
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-3 py-2 rounded-xl border focus:outline-none w-full disabled:bg-gray-100"
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Confirm New Password
              </label>
              <input
                placeholder="Confirm new password"
                type="password"
                name="confirm-password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="px-3 py-2 rounded-xl border focus:outline-none w-full disabled:bg-gray-100"
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>
            
            {/* Password strength indicator */}
            {password && (
              <div className="text-xs space-y-1">
                <p className={`${password.length >= 6 ? 'text-green-600' : 'text-gray-500'}`}>
                  {password.length >= 6 ? '✓' : '○'} At least 6 characters
                </p>
                <p className={`${password === confirmPassword && password ? 'text-green-600' : 'text-gray-500'}`}>
                  {password === confirmPassword && password ? '✓' : '○'} Passwords match
                </p>
              </div>
            )}

            <Button
              isLoading={isLoading}
              isDisabled={isLoading}
              type="submit"
              color="primary"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
          <div className="flex justify-center mt-2">
            <Link href="/login">
              <button className="font-semibold text-sm text-blue-700 hover:text-blue-800 transition">
                Back to Sign In
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}