"use client";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@nextui-org/react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useRouter } from "next/navigation";
import { dispatchCartUpdate, CART_ACTIONS } from "@/lib/cartUtils";

export default function AddToCartButton({ productId, type }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const router = useRouter();

  // Fetch user's cart items
  useEffect(() => {
    if (user?.id) {
      fetchCartItems();
      
      // Real-time subscription for cart updates
      const channel = supabase
        .channel(`cart-btn-${productId}:user_id=eq.${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "cart",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchCartItems();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id, productId]);

  const fetchCartItems = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("cart")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching cart:", error);
      return;
    }

    setCartItems(data || []);
  };

  const isAdded = cartItems.find((item) => item?.product_id === productId);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        router.push("/login");
        toast.error("Please log in first!");
        setIsLoading(false);
        return;
      }

      if (isAdded) {
        // Optimistically remove from UI
        setCartItems(prev => prev.filter(item => item.product_id !== productId));

        // Dispatch event to update header instantly
        dispatchCartUpdate(CART_ACTIONS.REMOVE);

        // Remove from cart
        const { error } = await supabase
          .from("cart")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);

        if (error) {
          // Revert on error
          await fetchCartItems();
          dispatchCartUpdate(CART_ACTIONS.ADD);
          throw error;
        }
        
        toast.success("Removed from cart");
      } else {
        // Optimistically add to UI
        const tempItem = {
          id: `temp-${Date.now()}`,
          user_id: user.id,
          product_id: productId,
          quantity: 1,
        };
        setCartItems(prev => [...prev, tempItem]);

        // Dispatch event to update header instantly
        dispatchCartUpdate(CART_ACTIONS.ADD);

        // Add to cart
        const { error } = await supabase
          .from("cart")
          .insert([
            {
              user_id: user.id,
              product_id: productId,
              quantity: 1,
            },
          ]);

        if (error) {
          // Revert on error
          setCartItems(prev => prev.filter(item => item.id !== tempItem.id));
          dispatchCartUpdate(CART_ACTIONS.REMOVE);
          throw error;
        }
        
        toast.success("Added to cart");
      }

      // Refresh cart items
      await fetchCartItems();
    } catch (error) {
      console.error("Cart error:", error);
      toast.error(error?.message || "Failed to update cart");
    }
    setIsLoading(false);
  };

  if (type === "cute") {
    return (
      <Button
        isLoading={isLoading}
        isDisabled={isLoading}
        onClick={handleClick}
        variant="bordered"
        className="hover:bg-blue-50 transition-colors"
      >
        {!isAdded && "Add To Cart"}
        {isAdded && "Remove from Cart"}
      </Button>
    );
  }

  if (type === "large") {
    return (
      <Button
        isLoading={isLoading}
        isDisabled={isLoading}
        onClick={handleClick}
        variant="bordered"
        color="primary"
        size="sm"
        className="font-semibold"
      >
        {!isAdded && <AddShoppingCartIcon className="text-base" />}
        {isAdded && <ShoppingCartIcon className="text-base" />}
        {!isAdded && "Add To Cart"}
        {isAdded && "Remove from Cart"}
      </Button>
    );
  }

  return (
    <Button
      isLoading={isLoading}
      isDisabled={isLoading}
      onClick={handleClick}
      variant="flat"
      isIconOnly
      size="sm"
      className={isAdded ? "bg-blue-100 text-blue-600" : ""}
    >
      {!isAdded && <AddShoppingCartIcon className="text-base" />}
      {isAdded && <ShoppingCartIcon className="text-base" />}
    </Button>
  );
}