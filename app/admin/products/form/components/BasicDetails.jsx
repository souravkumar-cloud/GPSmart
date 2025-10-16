'use client';

import { useBrands } from "@/lib/supabase/brands/read";
import { useCategories } from "@/lib/supabase/categories/read";

export default function BasicDetails({ data, handleData }) {
  const { data: brands, error: brandsError, isLoading: brandsLoading } = useBrands();
  const { data: categories, error: categoriesError, isLoading: categoriesLoading } = useCategories();

  if (brandsLoading || categoriesLoading) {
    return <div className="p-5 text-center">Loading...</div>;
  }

  if (brandsError) return <div>Error loading brands: {brandsError}</div>;
  if (categoriesError) return <div>Error loading categories: {categoriesError}</div>;

  return (
    <section className="flex-1 flex flex-col gap-5 bg-white rounded-xl p-4 border">
      <h1 className="font-semibold">Basic Details</h1>

      {/* Product Name */}
      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs" htmlFor="product-name">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter Product Name"
          id="product-name"
          value={data?.name ?? ""}
          onChange={(e) => handleData("name", e.target.value)}
          className="border px-4 py-2 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Short Description */}
      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs" htmlFor="product-short-description">
          Short Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter Short Description (for product cards)"
          id="product-short-description"
          value={data?.short_description ?? ""}
          onChange={(e) => handleData("short_description", e.target.value)}
          className="border px-4 py-2 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <span className="text-xs text-gray-400">Brief description shown in product listings</span>
      </div>

      {/* Brand */}
      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs" htmlFor="product-brand">
          Brand <span className="text-red-500">*</span>
        </label>
        <select
          id="product-brand"
          value={data?.brand ?? ""}
          onChange={(e) => handleData("brand", e.target.value)}
          className="border px-4 py-2 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select Brand</option>
          {brands?.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs" htmlFor="product-category">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="product-category"
          value={data?.category ?? ""}
          onChange={(e) => handleData("category", e.target.value)}
          className="border px-4 py-2 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select Category</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stock */}
      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs" htmlFor="product-stock">
          Stock Quantity <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          placeholder="Enter Stock Quantity"
          id="product-stock"
          min="0"
          value={data?.stock ?? ""}
          onChange={(e) => handleData("stock", e.target.valueAsNumber)}
          className="border px-4 py-2 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Price */}
      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs" htmlFor="product-price">
          Regular Price <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          placeholder="Enter Price"
          id="product-price"
          min="0"
          step="0.01"
          value={data?.price ?? ""}
          onChange={(e) => handleData("price", e.target.valueAsNumber)}
          className="border px-4 py-2 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Sale Price */}
      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs" htmlFor="product-sale-price">
          Sale Price (Optional)
        </label>
        <input
          type="number"
          placeholder="Enter Sale Price"
          id="product-sale-price"
          min="0"
          step="0.01"
          value={data?.sale_price ?? ""}
          onChange={(e) => handleData("sale_price", e.target.valueAsNumber)}
          className="border px-4 py-2 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-xs text-gray-400">Leave empty if no sale</span>
      </div>

      {/* Is Featured */}
      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs" htmlFor="product-is-featured">
          Feature this Product
        </label>
        <select
          id="product-is-featured"
          value={data?.is_featured ? "yes" : "no"}
          onChange={(e) => handleData("is_featured", e.target.value === "yes")}
          className="border px-4 py-2 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
        <span className="text-xs text-gray-400">Featured products appear on homepage</span>
      </div>
    </section>
  );
}