"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useReviews } from "../../../../../lib/supabase/reviews/read";
import { deleteReview } from "../../../../../lib/supabase/reviews/write";
import { Rating } from "@mui/material";
import { Avatar, Button } from "@nextui-org/react";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function Reviews({ productId }) {
  const { data, isLoading } = useReviews({ productId: productId });
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-3 rounded-xl border w-full">
        <h1 className="text-lg font-semibold">Reviews</h1>
        <p className="text-gray-500">Loading reviews...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-3 rounded-xl border w-full">
        <h1 className="text-lg font-semibold">Reviews</h1>
        <p className="text-gray-500">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3 md:p-6 rounded-xl border border-gray-200 bg-white shadow-sm w-full">
      <h1 className="text-xl font-bold text-gray-900">Customer Reviews</h1>
      <div className="flex flex-col gap-4">
        {data?.map((item) => {
          return <ReviewItem key={item.id} item={item} user={user} productId={productId} />;
        })}
      </div>
    </div>
  );
}

function ReviewItem({ item, user, productId }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    
    setIsDeleting(true);
    try {
      if (!user) {
        throw new Error("Please log in first");
      }
      
      await deleteReview({
        uid: user.id,
        productId: productId,
      });
      
      toast.success("Review deleted successfully");
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error(error?.message || "Failed to delete review");
    }
    setIsDeleting(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex gap-3 pb-4 border-b last:border-b-0">
      <div className="flex-shrink-0">
        <Avatar 
          src={item?.photo_url} 
          name={item?.display_name?.[0]?.toUpperCase()}
          className="w-12 h-12"
        />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-semibold text-gray-900">{item?.display_name}</h1>
            <div className="flex items-center gap-2">
              <Rating value={item?.rating} readOnly size="small" />
              <span className="text-xs text-gray-500">
                {formatDate(item?.created_at)}
              </span>
            </div>
          </div>
          {user?.id === item?.user_id && (
            <Button
              isIconOnly
              size="sm"
              color="danger"
              variant="flat"
              isDisabled={isDeleting}
              isLoading={isDeleting}
              onClick={handleDelete}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-700 pt-2 leading-relaxed">{item?.message}</p>
      </div>
    </div>
  );
}