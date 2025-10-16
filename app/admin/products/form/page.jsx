"use client";

import { useEffect, useState } from "react";
import BasicDetails from "./components/BasicDetails";
import Images from "./components/Images";
import Description from "./components/Description";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createNewProduct,
  updateProduct,
  uploadProductImage,
  uploadFeaturedImages,
} from "@/lib/supabase/products/write";
import { getProduct } from "@/lib/supabase/products/read";

export default function Page() {
  const [data, setData] = useState({});
  const [featureImage, setFeatureImage] = useState(null);
  const [imageList, setImageList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  // Fetch existing product if editing
  useEffect(() => {
    if (!id) return;

    setIsFetching(true);
    (async () => {
      try {
        const product = await getProduct(id);
        console.log('✅ Fetched product data:', product);
        
        setData({
          ...product,
          name: product.name || '',
          price: product.price || '',
          stock: product.stock || '',
          category: product.category || '',
          brand: product.brand || '',
          description: product.description || '',
          short_description: product.short_description || '',
          image_url: product.image_url || '',
          sale_price: product.sale_price || null,
          is_featured: product.is_featured || false,
          orders: product.orders || 0,
          featured_img: product.featured_img || [], // ✅ Load featured images
        });
        
        // Set imageList to existing featured_img URLs
        if (product.featured_img && Array.isArray(product.featured_img)) {
          setImageList(product.featured_img);
        }
        
        console.log('✅ Loaded featured_img:', product.featured_img);
      } catch (error) {
        console.error('❌ Error loading product:', error);
        toast.error(error.message || "Failed to load product");
      } finally {
        setIsFetching(false);
      }
    })();
  }, [id]);

  const handleData = (key, value) => {
    console.log('📝 Setting data:', key, '=', value);
    setData((prev) => {
      const newData = { ...prev, [key]: value };
      console.log('📦 Updated data state:', newData);
      return newData;
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Upload main feature image if new
      let imageURL = data.image_url || null;
      if (featureImage) {
        console.log('📤 Uploading main image...');
        const formData = new FormData();
        formData.append('file', featureImage);
        imageURL = await uploadProductImage(formData);
        console.log('✅ Main image uploaded:', imageURL);
      }

      // Upload featured images (gallery)
      let featuredImageURLs = [];
      
      // Separate existing URLs from new File objects
      const existingURLs = imageList.filter(img => typeof img === 'string');
      const newFiles = imageList.filter(img => img instanceof File);
      
      console.log('📤 Existing featured URLs:', existingURLs.length);
      console.log('📤 New featured files to upload:', newFiles.length);
      
      // Upload new files
      if (newFiles.length > 0) {
        const newURLs = await uploadFeaturedImages(newFiles);
        featuredImageURLs = [...existingURLs, ...newURLs];
        console.log('✅ Featured images uploaded:', newURLs);
      } else {
        featuredImageURLs = existingURLs;
      }

      // Prepare product data
      const productData = {
        name: data.name,
        price: data.price,
        stock: data.stock,
        category: data.category,
        brand: data.brand,
        description: data.description || '',
        short_description: data.short_description || '',
        image_url: imageURL,
        sale_price: data.sale_price || null,
        is_featured: data.is_featured || false,
        featured_img: featuredImageURLs, // ✅ JSONB array of URLs
      };

      console.log('💾 Submitting product data:', productData);
      console.log('💾 featured_img being saved:', productData.featured_img);

      if (id) {
        await updateProduct(id, { data: productData });
        toast.success("Product updated successfully!");
      } else {
        await createNewProduct({ data: productData });
        toast.success("Product created successfully!");
        setData({});
        setFeatureImage(null);
        setImageList([]);
      }

      router.push("/admin/products");
    } catch (error) {
      console.error('❌ Submit error:', error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Debug: Log data changes
  useEffect(() => {
    if (Object.keys(data).length > 0) {
      console.log('🔍 Current form data:', data);
      console.log('🔍 Current featured_img:', data.featured_img);
      console.log('🔍 Current imageList:', imageList);
    }
  }, [data, imageList]);

  if (isFetching) {
    return (
      <div className="flex justify-center items-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-3">Loading product...</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="flex flex-col gap-4 p-5"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-semibold text-xl">
            {id ? "Update Product" : "Create New Product"}
          </h1>
          {id && (
            <p className="text-sm text-gray-500 mt-1">
              Product ID: {id}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#313131] text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-[#424242] transition-colors flex items-center gap-2"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            )}
            {isLoading ? (id ? "Updating..." : "Creating...") : id ? "Update" : "Create"}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-5">
        <div className="flex-1">
          <BasicDetails data={data} handleData={handleData} />
        </div>
        <div className="flex-1 flex flex-col gap-5">
          <Images
            data={data}
            featureImage={featureImage}
            setFeatureImage={setFeatureImage}
            imageList={imageList}
            setImageList={setImageList}
          />
          <Description data={data} handleData={handleData} />
        </div>
      </div>
    </form>
  );
}