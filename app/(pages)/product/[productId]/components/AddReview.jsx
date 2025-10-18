"use client";

import { useAuth } from "@/contexts/AuthContext";
import { addReview } from "../../../../../lib/supabase/reviews/write";
import { Rating } from "@mui/material";
import { Button } from "@nextui-org/react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function AddReview({ productId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(4);
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (!user) {
        throw new Error("Please log in first");
      }

      await addReview({
        uid: user.id,
        productId: productId,
        rating: rating,
        message: message,
        displayName: user.user_metadata?.name || user.email?.split('@')[0] || "Anonymous",
        photoURL: user.user_metadata?.avatar_url || null,
      });

      setMessage("");
      setRating(4);
      toast.success("Review submitted successfully!");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error?.message || "Failed to submit review");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 rounded-xl border border-gray-200 bg-white shadow-sm w-full">
      <h1 className="text-xl font-bold text-gray-900">Rate This Product</h1>
      
      {/* Rating Stars */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">Your Rating</label>
        <Rating
          value={rating}
          onChange={(event, newValue) => {
            setRating(newValue);
          }}
          size="large"
          className="text-yellow-500"
        />
      </div>

      {/* Review Message */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">Your Review</label>
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
          placeholder="Share your thoughts about this product..."
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500">{message.length} characters</p>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        isLoading={isLoading}
        isDisabled={isLoading || !rating || !message.trim()}
        color="primary"
        size="lg"
        className="w-full font-semibold"
      >
        {isLoading ? "Submitting..." : "Submit Review"}
      </Button>

      {!user && (
        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
          Please log in to submit a review
        </p>
      )}
    </div>
  );
}