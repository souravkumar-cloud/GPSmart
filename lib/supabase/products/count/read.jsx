import { supabase } from "@/lib/supabaseClient";

export const getProductReviewCounts = async ({ productId }) => {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating", { count: "exact", head: false }) // get total count
    .eq("productId", productId);

  if (error) {
    console.error("❌ getProductReviewCounts Error:", error.message);
    return { totalReviews: 0, averageRating: 0 };
  }

  // Calculate totalReviews and averageRating
  const totalReviews = data.length;
  const averageRating =
    totalReviews > 0
      ? data.reduce((acc, item) => acc + item.rating, 0) / totalReviews
      : 0;

  return { totalReviews, averageRating };
};
