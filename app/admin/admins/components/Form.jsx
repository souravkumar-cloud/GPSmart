'use client';

import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAdminById } from '@/lib/supabase/admins/read_server';
import { createNewAdmin, updateAdmin } from '@/lib/supabase/admins/write';

const AdminForm = () => {
  const [data, setData] = useState({ name: '', email: '' });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const adminId = searchParams.get('id');

  // Fetch admin data if editing
  useEffect(() => {
    if (adminId) {
      getAdminById({ adminId }).then((res) => {
        if (res) {
          setData({ name: res.name, email: res.email });
          setImagePreview(res.imageURL || null);
        } else {
          toast.error('Admin not found');
        }
      });
    }
  }, [adminId]);

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
      if (adminId) {
        await updateAdmin({ id: adminId, image, data });
        toast.success('Admin updated!');
        router.push('/admin/admins');
      } else {
        await createNewAdmin({ image, data });
        toast.success('Admin created!');
      }

      // Reset form
      setData({ name: '', email: '' });
      setImage(null);
      setImagePreview(null);
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-white p-5 rounded-xl w-full md:w-[400px]">
      <h1 className="font-semibold">{adminId ? 'Update' : 'Create'} Admin</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col gap-3"
      >
        {/* Image */}
        <div className="flex flex-col gap-1">
          <label htmlFor="admin-img" className="text-gray-600 text-sm">
            Image <span className="text-red-500">*</span>
          </label>

          {imagePreview && (
            <div className="flex justify-center items-center p-3">
              <img
                className="h-20 object-cover"
                src={imagePreview}
                alt="Admin"
              />
            </div>
          )}

          <input
            onChange={(e) => {
              if (e.target.files.length > 0) setImage(e.target.files[0]);
            }}
            id="admin-img"
            type="file"
            accept="image/*"
            className="border px-4 py-2 rounded-lg w-full focus:outline"
          />
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1">
          <label htmlFor="admin-name" className="text-gray-600 text-sm">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="admin-name"
            type="text"
            value={data?.name ?? ''}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            placeholder="Enter Name"
            className="border px-4 py-2 rounded-lg w-full focus:outline"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label htmlFor="admin-email" className="text-gray-600 text-sm">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="admin-email"
            type="email"
            value={data?.email ?? ''}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            placeholder="Enter Email"
            className="border px-4 py-2 rounded-lg w-full focus:outline"
          />
        </div>

        <Button
          type="submit"
          className="bg-gray-400 hover:bg-gray-300"
          disabled={isLoading}
        >
          {isLoading
            ? adminId
              ? 'Updating...'
              : 'Creating...'
            : adminId
            ? 'Update'
            : 'Create'}
        </Button>
      </form>
    </div>
  );
};

export default AdminForm;
