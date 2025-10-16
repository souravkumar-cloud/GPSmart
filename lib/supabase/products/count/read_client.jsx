import { supabase } from "@/lib/supabaseClient";
import useSWR from "swr";

// Function to get total number of products
export const getProductsCount = async () => {
  const { count, error } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true }); // head: true avoids fetching rows

  if (error) {
    console.error("❌ getProductsCount Error:", error.message);
    return 0;
  }

  return count ?? 0;
};

// SWR hook for reactive count
export function useProductCount() {
  const { data, error, isLoading } = useSWR("products_count", getProductsCount);

  if (error) console.error("❌ useProductCount Error:", error.message);

  return { data, error, isLoading };
}
