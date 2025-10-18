// components/RelatedProducts.js or wherever you keep this component

import ProductGridView from "../../../../../components/Products";
import { supabase } from "@/lib/supabaseClient";

export default async function RelatedProducts({ categoryId, currentProductId }) {
  if (!categoryId) return null;

  // Get products from the same category, excluding current product
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", categoryId)
    .neq("id", currentProductId) // Exclude current product
    .limit(8); // Limit to 8 related products

  if (error || !products || products.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex justify-center bg-gray-50 py-8">
      <div className="flex flex-col gap-5 max-w-7xl px-5 w-full">
        <h1 className="text-center font-bold text-2xl text-gray-800">
          Related Products
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
          {products?.map((item) => {
            return (
              <div key={item.id}>
                {/* Use the ProductCard from ProductGridView */}
                <ProductGridView products={[item]} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}