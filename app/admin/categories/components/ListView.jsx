'use client'

import { Edit2, Loader2, Trash } from "lucide-react";
import { useCategories } from "../../../../lib/firestore/categories/read"
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useState } from "react";
import { deleteCategory } from "../../../../lib/firestore/categories/write";
import { useRouter } from "next/navigation";
const ListView = () => {
  const {data:categories,error,isLoading}=useCategories();

  if(isLoading){
    return(
      <div>
        <Loader2 className="animate-spin"/>
      </div>
    )
  };
  if(error) return <div>Error: {error}</div>;
  return (
    <div className='flex-1 flex flex-col gap-3 md:pr-5 md:px-0 rounded-xl px-5'>
      <h1 className="text-xl font-semibold">Categories</h1>
      <table className="border-separate border-spacing-y-3">
        <thead className="">
          <tr className="">
            <th className="font-semibold border-y bg-white px-3 py-2 border-l rounded-l-xl">SN</th>
            <th className="font-semibold border-y bg-white px-3 py-2 ">Image</th>
            <th className="font-semibold border-y bg-white px-3 py-2 text-left">Name</th>
            <th className="font-semibold border-y bg-white px-3 py-2 border-r rounded-r-xl text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="">
          {
            categories && categories.map((category,index)=>{
              return(
               <Row index={index} category={category} key={category.id}/>
              )
            })
          }
        </tbody>
      </table>
    </div>
  )
}

export default ListView

function Row({category,index}){
  const [isDelete,setIsdelete]=useState(false);
  const router = useRouter();
  const handledelete=async()=>{
    if(!confirm("Are you sure you want to delete this category?")) return;
    //delete logic
    setIsdelete(true);
    try{
      await deleteCategory({id:category.id});
      toast.success("Category deleted successfully");
    }catch(err){
      toast.error(err.message || "Something went wrong");
    }
    setIsdelete(false);
  }
  const handleEdit=()=>{
    router.push(`/admin/categories?id=${category?.id}`);
  }
  return(
    <tr key={category ?? index}>
      <td className="border-y bg-white px-3 py-2 border-l rounded-l-xl text-center ">{index+1}.</td>
      <td className="border-y bg-white px-3 py-2">
        <div className="flex justify-center">
          <img src={category?.imageURL} className="h-10 w-10 object-cover " alt="" />
        </div>
      </td>
      <td className="border-y bg-white px-3 py-2 ">{category?.name}</td>
      <td className="border-y bg-white px-3 py-2 border-r rounded-r-xl">
        <div className="flex gap-2 items-center">
          <Button
            onClick={handleEdit}
            disabled={isDelete}
            size='sm' className="bg-gray-400 hover:bg-gray-300"> 
            <Edit2 size={13}/>
          </Button>
          <Button size='sm' className="bg-red-500 hover:bg-red-300"
            onClick={handledelete}
            disabled={isDelete}
            
          > 
            <Trash size={13}/>
          </Button>
        </div>
      </td>
    </tr>
  )
}