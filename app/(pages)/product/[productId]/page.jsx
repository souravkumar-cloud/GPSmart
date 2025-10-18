import { supabase } from "@/lib/supabaseClient";
import Photos from "./components/Photos";
import Details from "./components/Details";
import Reviews from "./components/Reviews";
import RelatedProducts from "./components/RelatedProducts";
import AddReview from "./components/AddReview";
import AuthContextProvider from "@/contexts/AuthContext";
import { use } from "react";

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  const unwrappedParams = await params;
  const { productId } = unwrappedParams;
  
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The product you're looking for doesn't exist.",
    };
  }

  // Get first image from featured_img array
  const firstImage = Array.isArray(product?.featured_img) 
    ? product.featured_img[0] 
    : product?.featured_img;

  return {
    title: `${product?.name} | Product`,
    description: product?.short_description ?? "",
    openGraph: {
      images: [firstImage],
      title: product?.name,
      description: product?.short_description,
    },
  };
}

export default async function Page({ params }) {
  const unwrappedParams = await params;
  const { productId } = unwrappedParams;
  
  // Fetch product data
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  // Handle error or missing product
  if (error || !product) {
    return (
      <main className="p-5 md:p-10">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Product Not Found</h1>
          <p className="text-gray-600">The product you're looking for doesn't exist.</p>
          <a href="/" className="text-blue-600 hover:underline">
            Go back to home
          </a>
        </div>
      </main>
    );
  }

  // Prepare image list
  const imageList = Array.isArray(product?.featured_img)
    ? product.featured_img
    : product?.featured_img
    ? [product.featured_img]
    : [];

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Product Details Section */}
      <section className="max-w-7xl mx-auto p-5 md:p-10">
        <div className="flex flex-col-reverse md:flex-row gap-6 md:gap-10 bg-white rounded-xl p-4 md:p-6 shadow-sm">
          <div className="w-full md:w-1/2">
            <Photos imageList={imageList} />
          </div>
          <div className="w-full md:w-1/2">
            <Details product={product} />
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 py-10">
        <AuthContextProvider>
          <div className="flex flex-col lg:flex-row gap-6 w-full">
            <div className="w-full lg:w-1/2">
              <AddReview productId={productId} />
            </div>
            <div className="w-full lg:w-1/2">
              <Reviews productId={productId} />
            </div>
          </div>
        </AuthContextProvider>
      </section>

      {/* Related Products Section */}
      <RelatedProducts 
        categoryId={product?.category_id} 
        currentProductId={productId}
      />
    </main>
  );
}