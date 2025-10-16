'use client';

import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useProducts } from '@/lib/supabase/products/read';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { getCollectionById } from '@/lib/supabase/collections/read_server';
import { useRouter } from 'next/navigation';
import { createNewCollection, updateCollection } from '@/lib/supabase/collections/write';
import { X, ChevronDown } from 'lucide-react';

const Form = () => {
  const [data, setData] = useState({ name: '', products: [], subTitle: '' });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data: products } = useProducts({ pageLimit: 2000 });

  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('id');

  useEffect(() => {
    if (collectionId) {
      getCollectionById({ collectionId }).then((res) => {
        if (res) {
          // Ensure products is always an array
          const productsArray = Array.isArray(res.products) ? res.products : 
                               typeof res.products === 'string' ? [res.products] : [];
          
          setData({
            name: res.name,
            products: productsArray,
            subTitle: res.subTitle || ''
          });
          setPreview(res.imageURL || null);
          console.log('Loaded collection products:', productsArray);
        } else {
          toast.error('Collection not found');
        }
      });
    }
  }, [collectionId]);

  const handleAddProduct = () => {
    if (selectedProductId && !data.products.includes(selectedProductId)) {
      setData((prev) => ({
        ...prev,
        products: [...prev.products, selectedProductId]
      }));
      setSelectedProductId('');
    }
  };

  const handleRemoveProduct = (productId) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.filter((id) => id !== productId)
    }));
  };

  const getProductName = (productId) => {
    if (!products) return productId;
    const product = products.find((p) => p.id === productId);
    return product?.name || productId;
  };

  const getAvailableProducts = () => {
    if (!products) return [];
    // Filter out products already added to the collection
    return products.filter(p => !data.products.includes(p.id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Ensure products is always an array
      const submitData = {
        ...data,
        products: Array.isArray(data.products) ? data.products : []
      };

      if (collectionId) {
        await updateCollection({ 
          id: collectionId, 
          image: image || null, 
          data: submitData 
        });
        toast.success('Collection updated!');
        router.push('/admin/collections');
      } else {
        await createNewCollection({ image, data: submitData });
        toast.success('Collection created!');
      }
      setData({ name: '', products: [], subTitle: '' });
      setImage(null);
      setPreview(null);
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex gap-6 p-6 bg-gray-100 min-h-screen">
      {/* Left Panel - Form */}
      <div className="w-96 bg-white rounded-lg shadow p-6 h-fit">
        <h1 className="text-lg font-semibold text-gray-800 mb-6">
          {collectionId ? 'Update' : 'Create'} Collection
        </h1>

        <div onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Image */}
          <div className="flex flex-col gap-2">
            <label htmlFor="collection-img" className="text-gray-600 text-sm font-medium">
              Image <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                onChange={(e) => {
                  if (e.target.files.length > 0) setImage(e.target.files[0]);
                }}
                id="collection-img"
                type="file"
                accept="image/*"
                disabled={isLoading}
                className="hidden"
              />
              <label
                htmlFor="collection-img"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded cursor-pointer hover:bg-gray-300 text-sm font-medium"
              >
                Choose File
              </label>
              <span className="text-sm text-gray-600">
                {image?.name || (preview ? 'Image selected' : 'No file chosen')}
              </span>
            </div>
            {(image || preview) && (
              <img
                className="mt-2 h-20 object-cover rounded border border-gray-300"
                src={image ? URL.createObjectURL(image) : preview}
                alt="Collection preview"
              />
            )}
          </div>

          {/* Name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="collection-name" className="text-gray-600 text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="collection-name"
              type="text"
              value={data?.name ?? ''}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="Enter collection name"
              disabled={isLoading}
              className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          {/* Sub Title */}
          <div className="flex flex-col gap-2">
            <label htmlFor="collection-sub-title" className="text-gray-600 text-sm font-medium">
              Sub Title <span className="text-red-500">*</span>
            </label>
            <input
              id="collection-sub-title"
              type="text"
              value={data?.subTitle ?? ''}
              onChange={(e) => setData({ ...data, subTitle: e.target.value })}
              placeholder="Enter sub title"
              disabled={isLoading}
              className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          {/* Selected Products */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-600 text-sm font-medium">
              Selected Products ({data.products.length})
            </label>
            <div className="space-y-2 min-h-12">
              {data.products.map((productId) => (
                <div
                  key={productId}
                  className="flex items-center justify-between bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium"
                >
                  <span className="truncate">{getProductName(productId)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(productId)}
                    disabled={isLoading}
                    className="text-white hover:text-red-200 ml-2 flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Select Products Dropdown */}
          <div className="flex flex-col gap-2">
            <label htmlFor="collection-products" className="text-gray-600 text-sm font-medium">
              Select Products <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="collection-products"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                disabled={isLoading}
                className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white cursor-pointer"
              >
                <option value="">Choose a product...</option>
                {products?.map((item) => (
                  <option
                    key={item?.id}
                    value={item?.id}
                    disabled={data.products.includes(item?.id)}
                  >
                    {item?.name}
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
            disabled={isLoading || !selectedProductId}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 disabled:bg-gray-400"
          >
            Add Product
          </button>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            className="bg-gray-400 hover:bg-gray-500 w-full"
            disabled={isLoading || !data.name || !data.subTitle || data.products.length === 0}
          >
            {isLoading
              ? collectionId
                ? 'Updating...'
                : 'Creating...'
              : collectionId
                ? 'Update'
                : 'Create'}
          </Button>
        </div>
      </div>

    </div>
  );
};

export default Form;