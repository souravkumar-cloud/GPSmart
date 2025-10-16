"use client";

import { supabase } from "@/lib/supabaseClient";
import useSWRSubscription from "swr/subscription";

export function useBrands() {
  const { data, error } = useSWRSubscription(
    ["brands"], // Supabase table name
    ([table], { next }) => {
      let isSubscribed = true;

      // 1️⃣ Initial fetch
      supabase
        .from("brands") // ✅ explicitly use your actual table name
        .select("*")
        .then(({ data, error }) => {
          if (!isSubscribed) return;
          if (error) next(error, null);
          else next(null, data);
        });

      // 2️⃣ Realtime subscription
      const channel = supabase
        .channel("public:brands") // ✅ table name in channel
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "brands" }, // ✅ table name
          async () => {
            if (!isSubscribed) return;
            const { data, error } = await supabase.from("brands").select("*");
            if (error) next(error, null);
            else next(null, data);
          }
        )
        .subscribe();

      // Cleanup on unmount
      return () => {
        isSubscribed = false;
        supabase.removeChannel(channel);
      };
    }
  );

  return { data, error: error?.message || null, isLoading: !data && !error };
}
