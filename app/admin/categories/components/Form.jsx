'use client';

import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { getCategoryById } from '@/lib/firestore/categories/read_server';
import { useRouter } from 'next/navigation';
import { createNewCategory, updateCategory } from '@/lib/firestore/categories/write';

const Form = () => {
  const [data, setData] = useState({ name: '', slug: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const searchParams = useSearchParams();
  const categoryId = searchParams.get('id');

  useEffect(() => {
    if (categoryId) {
      getCategoryById({ categoryId }).then((res) => {
        if (res) {
          setData({ name: res.name, slug: res.slug });
          setPreview(res.imageURL || null);
        } else {
          toast.error('Category not found');
        }
      });
    }
  }, [categoryId]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (categoryId) {
        await updateCategory({ id: categoryId, image, data });
        toast.success('Category updated!');
        setData({ name: '', slug: '' });
        setImage(null);
        setPreview(null);
        router.push('/admin/categories');
      } else {
        await createNewCategory({ image, data });
        toast.success('Category created!');
        setData({ name: '', slug: '' });
        setImage(null);
        setPreview(null);
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    }
    setIsLoading(false);
  };
  

  return (
    <div className="flex flex-col gap-3 bg-white p-5 rounded-xl w-full md:w-[400px]">
      <h1 className="font-semibold">
        {categoryId ? 'Update' : 'Create'} Category
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col gap-3"
      >
        {/* Image */}
        <div className="flex flex-col gap-1">
          <label htmlFor="category-img" className="text-gray-600 text-sm">
            Image <span className="text-red-500">*</span>
          </label>
          {(image || preview) && (
            <div className="flex justify-center items-center p-3">
              <img
                className="h-20 object-cover"
                src={image ? URL.createObjectURL(image) : preview}
                alt="Category"
              />
            </div>
          )}
          <input
            onChange={(e) => {
              if (e.target.files.length > 0) setImage(e.target.files[0]);
            }}
            id="category-img"
            type="file"
            accept="image/*"
            className="border px-4 py-2 rounded-lg w-full focus:outline"
          />
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1">
          <label htmlFor="category-name" className="text-gray-600 text-sm">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="category-name"
            type="text"
            value={data?.name ?? ''}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            placeholder="Enter Name"
            className="border px-4 py-2 rounded-lg w-full focus:outline"
          />
        </div>

        {/* Slug */}
        <div className="flex flex-col gap-1">
          <label htmlFor="category-slug" className="text-gray-600 text-sm">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            id="category-slug"
            type="text"
            value={data?.slug ?? ''}
            onChange={(e) => setData({ ...data, slug: e.target.value })}
            placeholder="Enter Slug"
            className="border px-4 py-2 rounded-lg w-full focus:outline"
          />
        </div>

        <Button
          type="submit"
          className="bg-gray-400 hover:bg-gray-300"
          disabled={isLoading}
        >
          {isLoading
            ? categoryId
              ? 'Updating...'
              : 'Creating...'
            : categoryId
            ? 'Update'
            : 'Create'}
        </Button>
      </form>
    </div>
  );
};

export default Form;
