"use client";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function CheckoutLayout({ children }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type");
  const productId = searchParams.get("productId");
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      router.push("/login");
      return;
    }

    validateCheckout();
  }, [user?.id, type, productId]);

  const validateCheckout = async () => {
    try {
      setLoading(true);

      // If type is "buynow", check if productId exists
      if (type === "buynow") {
        if (!productId) {
          setError("Product not found");
          setLoading(false);
          return;
        }

        // Verify product exists
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("id")
          .eq("id", productId)
          .single();

        if (productError || !product) {
          setError("Product not found");
          setLoading(false);
          return;
        }
      }

      // If type is "cart", check if cart has items
      if (type === "cart" || !type) {
        const { data, error: cartError } = await supabase
          .from("cart")
          .select("*")
          .eq("user_id", user.id);

        if (cartError) {
          setError("Failed to load cart");
          setLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          setError("empty_cart");
          setLoading(false);
          return;
        }

        setCartItems(data);
      }

      setLoading(false);
    } catch (err) {
      console.error("Validation error:", err);
      setError("Something went wrong");
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error: Empty cart
  if (error === "empty_cart") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShoppingBag size={80} className="mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            Your Cart is Empty
          </h2>
          <p className="text-gray-600 mb-8">
            Please add some products to your cart before proceeding to checkout.
          </p>
          <Link href="/">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg">
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Error: Product not found
  if (error === "Product not found") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShoppingBag size={80} className="mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            Product Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The product you're trying to buy could not be found.
          </p>
          <Link href="/">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg">
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Other errors
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-6">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {error}
          </h2>
          <p className="text-gray-600 mb-8">
            Please try again or contact support if the problem persists.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg">
                Go to Home
              </button>
            </Link>
            <Link href="/cart">
              <button className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-all">
                View Cart
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success: Render children
  return <>{children}</>;
}