'use client';

import { Edit2, Loader2, Trash } from "lucide-react";
import { useBrands } from "../../../../lib/supabase/brands/read";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useState } from "react";
import { deleteBrand } from "../../../../lib/supabase/brands/write";
import { useRouter } from "next/navigation";

const ListView = () => {
  const { data: brands, error, isLoading } = useBrands();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex justify-center p-5">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    );
  }

  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex-1 flex flex-col gap-3 md:pr-5 md:px-0 rounded-xl px-5">
      <h1 className="text-xl font-semibold">Brands</h1>
      <table className="border-separate border-spacing-y-3 w-full">
        <thead>
          <tr>
            <th className="font-semibold border-y bg-white px-3 py-2 border-l rounded-l-xl">SN</th>
            <th className="font-semibold border-y bg-white px-3 py-2">Image</th>
            <th className="font-semibold border-y bg-white px-3 py-2 text-left">Name</th>
            <th className="font-semibold border-y bg-white px-3 py-2 border-r rounded-r-xl text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {brands && brands.map((brand, index) => (
            <Row key={brand.id} brand={brand} index={index} router={router} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListView;

function Row({ brand, index, router }) {
  const [isDelete, setIsDelete] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this brand?")) return;

    setIsDelete(true);
    try {
      await deleteBrand({ id: brand.id });
      toast.success("Brand deleted successfully");
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
    setIsDelete(false);
  };

  const handleEdit = () => {
    router.push(`/admin/brands?id=${brand.id}`);
  };

  return (
    <tr>
      <td className="border-y bg-white px-3 py-2 border-l rounded-l-xl text-center">{index + 1}.</td>
      <td className="border-y bg-white px-3 py-2">
        <div className="flex justify-center">
          <img src={brand.imageURL} className="h-10 w-10 object-cover" alt={brand.name} />
        </div>
      </td>
      <td className="border-y bg-white px-3 py-2">{brand.name}</td>
      <td className="border-y bg-white px-3 py-2 border-r rounded-r-xl">
        <div className="flex gap-2 items-center">
          <Button
            onClick={handleEdit}
            disabled={isDelete}
            size="sm"
            className="bg-gray-400 hover:bg-gray-300"
          >
            <Edit2 size={13} />
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDelete}
            size="sm"
            className="bg-red-500 hover:bg-red-300"
          >
            <Trash size={13} />
          </Button>
        </div>
      </td>
    </tr>
  );
}
