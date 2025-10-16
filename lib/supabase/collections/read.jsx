"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import useSWRSubscription from "swr/subscription";
import { createNewCollection, updateCollection } from "./write";
import { X, ChevronDown } from "lucide-react";

export function useCollections() {
  const { data, error } = useSWRSubscription(
    ["collections"],
    ([table], { next }) => {
      supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (error) next(error, null);
          else next(null, data || []);
        });

      const channel = supabase
        .channel(`public:${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          (payload) => {
            next(null, (prevData) => {
              if (!Array.isArray(prevData)) return prevData;

              const newData = [...prevData];

              if (payload.eventType === "INSERT") {
                newData.unshift(payload.new);
              } else if (payload.eventType === "UPDATE") {
                const idx = newData.findIndex((item) => item.id === payload.new.id);
                if (idx >= 0) newData[idx] = payload.new;
              } else if (payload.eventType === "DELETE") {
                return newData.filter((item) => item.id !== payload.old.id);
              }

              return newData;
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  );

  return {
    data: data || [],
    error: error?.message || (error ? JSON.stringify(error) : null),
    isLoading: data === undefined,
  };
}

export default function CollectionForm({ initialData = null, onSuccess }) {
  const { data: allCollections } = useCollections();
  const allProducts = [...new Set(allCollections.flatMap((c) => c.products || []))].sort();

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    subTitle: initialData?.subTitle || "",
    products: initialData?.products || [],
  });
  const [selectedProduct, setSelectedProduct] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialData?.imageURL || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = () => {
    if (selectedProduct && !formData.products.includes(selectedProduct)) {
      setFormData((prev) => ({
        ...prev,
        products: [...prev.products, selectedProduct],
      }));
      setSelectedProduct("");
    }
  };

  const handleRemoveProduct = (product) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p !== product),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!formData.name) throw new Error("Name is required");
      if (formData.products.length === 0) throw new Error("Add at least one product");

      const payload = {
        name: formData.name,
        subTitle: formData.subTitle,
        products: formData.products,
      };

      if (initialData?.id) {
        if (!image && !imagePreview) throw new Error("Image is required");
        await updateCollection({
          id: initialData.id,
          image,
          data: { ...payload, imageURL: imagePreview },
        });
      } else {
        if (!image) throw new Error("Image is required");
        await createNewCollection({ image, data: payload });
      }

      setFormData({
        name: "",
        subTitle: "",
        products: [],
      });
      setImage(null);
      setImagePreview(null);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-6 p-6 bg-gray-100 min-h-screen">
      {/* Left Panel - Form */}
      <div className="w-96 bg-white rounded-lg shadow p-6 h-fit">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">
          {initialData ? "Edit Collection" : "Create Collection"}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isLoading}
              id="image-upload"
              className="hidden"
            />
            <label
              htmlFor="image-upload"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded cursor-pointer hover:bg-gray-300 text-sm font-medium"
            >
              Choose File
            </label>
            <span className="text-sm text-gray-600">
              {image?.name || (imagePreview ? "Image selected" : "No file chosen")}
            </span>
          </div>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-3 w-20 h-20 object-cover rounded border border-gray-300"
            />
          )}
        </div>

        {/* Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Apple"
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Sub Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sub Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.subTitle}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, subTitle: e.target.value }))
            }
            placeholder="Best Products"
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Selected Products List */}
        <div className="mb-6">
          <div className="space-y-2 mb-3">
            {formData.products.map((product) => (
              <div
                key={product}
                className="flex items-center justify-between bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium"
              >
                <span className="truncate">{product}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(product)}
                  disabled={isLoading}
                  className="text-white hover:text-red-200 ml-2 flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Product Dropdown */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Product <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Choose a product...</option>
              {allProducts.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-3 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Add Product Button */}
        <button
          type="button"
          onClick={handleAddProduct}
          disabled={isLoading || !selectedProduct}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 disabled:bg-gray-400 mb-6"
        >
          Add Product
        </button>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || formData.products.length === 0}
          className="w-full px-4 py-2 bg-gray-400 text-white rounded text-sm font-medium hover:bg-gray-500 disabled:bg-gray-300"
        >
          {isLoading
            ? "Creating..."
            : initialData
              ? "Update"
              : "Create"}
        </button>
      </div>

      {/* Right Panel - Collections Table */}
      <div className="flex-1 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Collections</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">SN</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Image</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4 text-gray-600">1</td>
              <td className="py-3 px-4">
                <div className="w-10 h-10 bg-gray-200 rounded"></div>
              </td>
              <td className="py-3 px-4 text-gray-800">-</td>
              <td className="py-3 px-4">
                <button className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                  Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}