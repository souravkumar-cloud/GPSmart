import AddToCartButton from "../../../../../components/AddToCartButton";
import MyRating from "../../../../../components/MyRating";
import AuthContextProvider from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Suspense } from "react";

export default function Details({ product }) {
  const discount = product?.price && product?.sale_price 
        ? Math.round(((product.price - product.sale_price) / product.price) * 100)
        : 0;
  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex gap-3">
        <Category categoryId={product?.category_id} />
        <Brand brandId={product?.brand_id} />
      </div>
      <h1 className="font-semibold text-xl md:text-4xl">{product?.name}</h1>
      <Suspense fallback="Loading reviews...">
        <RatingReview product={product} />
      </Suspense>
      <h2 className="text-gray-600 text-sm line-clamp-3 md:line-clamp-4">
        {product?.short_description}
      </h2>
      <h3 className="text-green-500 font-bold text-lg">
        ₹ {product?.sale_price}{" "}
        <span className="line-through text-gray-700 text-sm">
          ₹ {product?.price}
        </span>
        {discount > 0 && (
                        <span className="text-xs m-4 font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded">
                            {discount}% OFF
                        </span>
                    )}
      </h3>
      
      <div className="flex flex-wrap items-center gap-4">
        <Link href={`/checkout?type=buynow&productId=${product?.id}`}>
          <button className="bg-black text-white rounded-lg px-4 py-1.5 hover:bg-gray-800 transition-colors">
            Buy Now
          </button>
        </Link>
        <AuthContextProvider>
          <AddToCartButton type={"cute"} productId={product?.id} />
        </AuthContextProvider>
      </div>
      {product?.stock <= (product?.orders ?? 0) && (
        <div className="flex">
          <h3 className="text-red-500 py-1 rounded-lg text-sm font-semibold">
            Out Of Stock
          </h3>
        </div>
      )}
      <div className="flex flex-col gap-2 py-2">
        <div
          className="prose prose-sm md:prose-base max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: product?.description ?? "" }}
        ></div>
      </div>
    </div>
  );
}

async function Category({ categoryId }) {
  if (!categoryId) return null;

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .single();

  if (!category) return null;

  return (
    <Link href={`/categories/${categoryId}`}>
      <div className="flex items-center gap-1 border px-3 py-1 rounded-full hover:bg-gray-50 transition-colors">
        <img className="h-4" src={category?.image_url} alt="" />
        <h4 className="text-xs font-semibold">{category?.name}</h4>
      </div>
    </Link>
  );
}

async function Brand({ brandId }) {
  if (!brandId) return null;

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("id", brandId)
    .single();

  if (!brand) return null;

  return (
    <div className="flex items-center gap-1 border px-3 py-1 rounded-full">
      <img className="h-4" src={brand?.image_url} alt="" />
      <h4 className="text-xs font-semibold">{brand?.name}</h4>
    </div>
  );
}

async function RatingReview({ product }) {
  // Get review statistics
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", product?.id);

  const totalReviews = reviews?.length || 0;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;

  return (
    <div className="flex gap-3 items-center">
      <MyRating value={averageRating} />
      <h1 className="text-sm text-gray-400">
        <span>{averageRating.toFixed(1)}</span> ({totalReviews})
      </h1>
    </div>
  );
}