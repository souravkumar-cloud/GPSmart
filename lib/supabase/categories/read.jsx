"use client";

import { supabase } from "@/lib/supabaseClient";
import useSWRSubscription from "swr/subscription";

export function useCategories() {
  const { data, error } = useSWRSubscription(
    ["categories"],
    ([table], { next }) => {
      // 1️⃣ Initial fetch
      supabase
        .from(table)
        .select("*")
        .then(({ data, error }) => {
          if (error) next(error, null);
          else next(null, data);
        });

      // 2️⃣ Realtime subscription
      const channel = supabase
        .channel(`public:${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          async () => {
            // Refetch whenever something changes
            const { data, error } = await supabase.from(table).select("*");
            if (error) next(error, null);
            else next(null, data);
          }
        )
        .subscribe();

      // Cleanup on unmount
      return () => {
        supabase.removeChannel(channel);
      };
    }
  );

  return { data, error: error?.message, isLoading: data === undefined };
}
