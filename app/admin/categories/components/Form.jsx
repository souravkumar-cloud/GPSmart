'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react';
import { createNewCategory } from '../../../../lib/firestore/categories/write';
import toast from 'react-hot-toast';

const Form = () => {
    const [data,setData]=useState(null);
    const [image,setImage]=useState(null);
    const [isLoading,setIsloading]=useState(false);
    
    const handleData=(key,value)=>{
        setData((preData)=>{
            return{
            ...(preData ?? {}),
            [key]:value,
        }})
    };
    const handleCreate=async()=>{
        setIsloading(true);
        try{
            setData(null);
            setImage(null);
            toast.success("Successfully Created");
            createNewCategory({data:data,image:image});
        }catch(err){
            toast.error(err?.message);
        }
        setIsloading(false);
    }
  return (
    <div className='flex flex-col gap-3 bg-white p-5  rounded-xl w-full md:w-[400px]'>
      <h1 className="font-semibold">Categoris Form</h1>
      <form action="" 
            onSubmit={(e)=>{
                e.preventDefault();
                handleCreate();
            }} 

            className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
             <label htmlFor="category-img" className="text-gray-600 text-sm">
                Image <span className="text-red-500">*</span>{" "}
            </label>
            {image && (
                <div className='flex justify-center items-center p-3'>
                    <img className='h-20' src={URL.createObjectURL(image)} alt="" />
                </div>
            )}
            <input
                onChange={(e)=>{
                    if(e.target.files.length > 0){
                        setImage(e.target.files[0]);
                    }
                }}
                id="category-img"
                name="category-img"
                type="file"
                accept="image/*"
                className="border px-4 py-2 rounded-lg w-full focus:outline"
            />
        </div>
        <div className="flex flex-col gap-1">
            <label htmlFor="category-name" className="text-gray-600 text-sm">
                Name <span className="text-red-500">*</span>{" "}
            </label>
            <input
                id="category-name"
                name="category-name"
                type="text"
                value={data?.name ?? ""}
                onChange={(e)=>{
                    handleData("name",e.target.value);
                }}
                placeholder="Enter Name"
                className="border px-4 py-2 rounded-lg w-full focus:outline"
            />
        </div>
        <div className="flex flex-col gap-1">
             <label htmlFor="category-slug" className="text-gray-600 text-sm">
                Slug <span className="text-red-500">*</span>{" "}
            </label>
            <input
                id="category-slug"
                name="category-slug"
                type="text"
                value={data?.slug ?? ""}
                onChange={(e)=>{
                    handleData("slug",e.target.value);
                }}
                placeholder="Enter Slug"
                className="border px-4 py-2 rounded-lg w-full focus:outline"
            />
        </div>
         <Button type="submit" className="bg-gray-400 hover:bg-gray-300">Create</Button>
      </form>
    </div>
    
  )
}

export default Form
