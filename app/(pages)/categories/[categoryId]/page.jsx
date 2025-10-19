import ProductGridView from "../../../../components/Products";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata({ params }) {
  const { categoryId } = params;
  
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .single();

  return {
    title: `${category?.name || 'Category'} | Your Store Name`,
    description: `Shop ${category?.name} products`,
    openGraph: {
      title: `${category?.name || 'Category'} | Your Store Name`,
      description: `Shop ${category?.name} products`,
      images: category?.image_url ? [category.image_url] : [],
    },
  };
}

export default async function CategoryPage({ params }) {
  const { categoryId } = params;

  // Fetch category details
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .single();

  // Fetch products by category
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });

  // Handle errors
  if (categoryError || !category) {
    return (
      <main className="flex justify-center items-center min-h-screen p-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Category Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The category you're looking for doesn't exist.
          </p>
          <Link href="/">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Go Back Home
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors">
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
        </Link>

        {/* Category Header */}
        <div className="mb-8 text-center">
          {category?.image_url && (
            <div className="flex justify-center mb-4">
              <img 
                src={category.image_url} 
                alt={category.name}
                className="h-20 w-20 object-contain"
              />
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            {category.name}
          </h1>
          {category?.description && (
            <p className="text-gray-600 max-w-2xl mx-auto">
              {category.description}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-4">
            {products?.length || 0} {products?.length === 1 ? 'product' : 'products'} available
          </p>
        </div>

        {/* Products Grid */}
        {productsError ? (
          <div className="text-center py-12">
            <p className="text-red-600">Failed to load products</p>
          </div>
        ) : products && products.length > 0 ? (
          <ProductGridView products={products} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No products found in this category yet.
            </p>
            <Link href="/">
              <button className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Browse All Products
              </button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}