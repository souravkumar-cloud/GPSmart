"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export function useReviews({ productId }) {
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      return;
    }

    // Initial fetch
    const fetchReviews = async () => {
      try {
        const { data: reviews, error: fetchError } = await supabase
          .from("reviews")
          .select("*")
          .eq("product_id", productId)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        setData(reviews?.length > 0 ? reviews : null);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchReviews();

    // Real-time subscription
    const channel = supabase
      .channel(`reviews:product_id=eq.${productId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "reviews",
          filter: `product_id=eq.${productId}`,
        },
        (payload) => {
          console.log("Review change received:", payload);
          // Refetch data when changes occur
          fetchReviews();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  return { data, error, isLoading };
}

export function useAllReviews() {
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchAllReviews = async () => {
      try {
        const { data: reviews, error: fetchError } = await supabase
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        setData(reviews?.length > 0 ? reviews : null);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching all reviews:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchAllReviews();

    // Real-time subscription for all reviews
    const channel = supabase
      .channel("all-reviews")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
        },
        (payload) => {
          console.log("Review change received:", payload);
          fetchAllReviews();
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { data, error, isLoading };
}