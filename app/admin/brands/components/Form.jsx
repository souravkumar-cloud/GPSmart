'use client';

import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import { getBrandById } from '@/lib/supabase/brands/read_server';
import { createNewBrand, updateBrand } from '@/lib/supabase/brands/write';

const Form = () => {
  const [data, setData] = useState({ name: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const brandId = searchParams.get('id');

  // Fetch brand data if editing
  useEffect(() => {
    if (brandId) {
      getBrandById({ brandId }).then((res) => {
        if (res) {
          setData({ name: res.name });
          setPreview(res.imageURL || null);
        } else {
          toast.error('Brand not found');
        }
      });
    }
  }, [brandId]);

  // Handle image preview
  useEffect(() => {
    if (image) {
      const url = URL.createObjectURL(image);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url); // cleanup
    }
  }, [image]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (brandId) {
        await updateBrand({ id: brandId, image, data });
        toast.success('Brand updated!');
        router.push('/admin/brands');
      } else {
        await createNewBrand({ image, data });
        toast.success('Brand created!');
      }

      // Reset form
      setData({ name: '' });
      setImage(null);
      setPreview(null);
      setImagePreview(null);
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-white p-5 rounded-xl w-full md:w-[400px]">
      <h1 className="font-semibold">{brandId ? 'Update' : 'Create'} Brand</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col gap-3"
      >
        {/* Image */}
        <div className="flex flex-col gap-1">
          <label htmlFor="brand-img" className="text-gray-600 text-sm">
            Image <span className="text-red-500">*</span>
          </label>

          {(image || preview) && (
            <div className="flex justify-center items-center p-3">
              <img
                className="h-20 object-cover"
                src={image ? imagePreview : preview}
                alt="Brand"
              />
            </div>
          )}

          <input
            onChange={(e) => {
              if (e.target.files.length > 0) setImage(e.target.files[0]);
            }}
            id="brand-img"
            type="file"
            accept="image/*"
            className="border px-4 py-2 rounded-lg w-full focus:outline"
          />
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1">
          <label htmlFor="brand-name" className="text-gray-600 text-sm">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="brand-name"
            type="text"
            value={data?.name ?? ''}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            placeholder="Enter Name"
            className="border px-4 py-2 rounded-lg w-full focus:outline"
          />
        </div>

        <Button
          type="submit"
          className="bg-gray-400 hover:bg-gray-300"
          disabled={isLoading}
        >
          {isLoading
            ? brandId
              ? 'Updating...'
              : 'Creating...'
            : brandId
            ? 'Update'
            : 'Create'}
        </Button>
      </form>
    </div>
  );
};

export default Form;
