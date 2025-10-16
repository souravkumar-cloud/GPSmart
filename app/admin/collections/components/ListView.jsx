'use client'

import { Edit2, Loader2, Trash2 } from "lucide-react";
import { useCollections } from "../../../../lib/supabase/collections/read"
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useState } from "react";
import { deleteCollection } from "../../../../lib/supabase/collections/write";
import { useRouter } from "next/navigation";

const ListView = () => {
  const { data: collections, error, isLoading } = useCollections();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
        Error: {error}
      </div>
    )
  }

  if (!collections || collections.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg">
        <p className="text-gray-600">No collections found</p>
      </div>
    )
  }

  return (
    <div className='flex-1 flex flex-col gap-4 md:pr-5 md:px-0 rounded-xl px-5'>
      <h1 className="text-2xl font-bold text-gray-800">Collections</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">SN</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Image</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Products</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {collections.map((collection, index) => (
              <Row 
                index={index} 
                collection={collection} 
                key={collection.id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ListView

function Row({ collection, index }) {
  const [isDelete, setIsDelete] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this collection?")) return;
    
    setIsDelete(true);
    try {
      await deleteCollection({ 
        id: collection.id,
        imageURL: collection.imageURL 
      });
      toast.success("Collection deleted successfully");
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
    setIsDelete(false);
  }

  const handleEdit = () => {
    router.push(`/admin/collections?id=${collection?.id}`);
  }

  const productCount = Array.isArray(collection?.products) 
    ? collection.products.length 
    : 0;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
        {index + 1}
      </td>
      <td className="px-6 py-4">
        <img 
          src={collection?.imageURL} 
          className="h-12 w-12 object-cover rounded-md border border-gray-200" 
          alt={collection?.name}
        />
      </td>
      <td className="px-6 py-4 text-sm text-gray-800 font-medium">
        {collection?.name}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {productCount} product{productCount !== 1 ? 's' : ''}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2 items-center">
          <Button
            onClick={handleEdit}
            disabled={isDelete}
            size='sm'
            className="bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            title="Edit collection"
          >
            <Edit2 size={16} />
          </Button>
          <Button
            size='sm'
            className="bg-red-500 hover:bg-red-600 text-white transition-colors"
            onClick={handleDelete}
            disabled={isDelete}
            title="Delete collection"
          >
            {isDelete ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </Button>
        </div>
      </td>
    </tr>
  )
}