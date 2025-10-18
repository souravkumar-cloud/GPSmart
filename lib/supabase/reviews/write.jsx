// hooks/reviews/write.js or lib/reviews/write.js

import { supabase } from "@/lib/supabaseClient";

/**
 * Add a new review for a product
 */
export const addReview = async ({
  uid,
  rating,
  message,
  productId,
  displayName,
  photoURL,
}) => {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert([
        {
          user_id: uid,
          product_id: productId,
          rating: rating || 0,
          message: message || "",
          display_name: displayName || "Anonymous",
          photo_url: photoURL || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("Error adding review:", error);
    throw error;
  }
};

/**
 * Update an existing review
 */
export const updateReview = async ({
  uid,
  productId,
  rating,
  message,
}) => {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .update({
        rating: rating || 0,
        message: message || "",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", uid)
      .eq("product_id", productId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("Error updating review:", error);
    throw error;
  }
};

/**
 * Delete a review
 */
export const deleteReview = async ({ productId, uid }) => {
  try {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("user_id", uid)
      .eq("product_id", productId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
};

/**
 * Get a user's review for a specific product
 */
export const getUserReview = async ({ productId, uid }) => {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", uid)
      .eq("product_id", productId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" - not an error in this case
      throw error;
    }

    return { success: true, data: data || null };
  } catch (error) {
    console.error("Error getting user review:", error);
    throw error;
  }
};

/**
 * Get review statistics for a product
 */
export const getReviewStats = async ({ productId }) => {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", productId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        success: true,
        stats: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      };
    }

    // Calculate statistics
    const totalReviews = data.length;
    const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;

    // Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.forEach((review) => {
      ratingDistribution[review.rating]++;
    });

    return {
      success: true,
      stats: {
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews,
        ratingDistribution,
      },
    };
  } catch (error) {
    console.error("Error getting review stats:", error);
    throw error;
  }
};