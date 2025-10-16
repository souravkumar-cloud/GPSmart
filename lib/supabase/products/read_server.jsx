import { supabase } from "@/lib/supabaseClient";

// Get single product by ID
export const getProduct = async ({ id }) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("❌ getProduct Error:", error.message);
    return null;
  }

  return data;
};

// Get featured products
export const getFeaturedProducts = async () => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("isFeatured", true);

  if (error) {
    console.error("❌ getFeaturedProducts Error:", error.message);
    return [];
  }

  return data;
};

// Get all products, ordered by creation timestamp descending
export const getProducts = async () => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("timestampCreate", { ascending: false });

  if (error) {
    console.error("❌ getProducts Error:", error.message);
    return [];
  }

  return data;
};

// Get products by category, ordered by creation timestamp descending
export const getProductsByCategory = async ({ categoryId }) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("categoryId", categoryId)
    .order("timestampCreate", { ascending: false });

  if (error) {
    console.error("❌ getProductsByCategory Error:", error.message);
    return [];
  }

  return data;
};
