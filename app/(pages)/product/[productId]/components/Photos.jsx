"use client";

import { useState } from "react";
import Image from "next/image";

export default function Photos({ imageList }) {
  const [selectedImage, setSelectedImage] = useState(imageList?.[0]);

  if (!imageList || imageList?.length === 0) {
    return (
      <div className="flex justify-center items-center h-[350px] md:h-[430px] bg-gray-100 rounded-lg">
        <p className="text-gray-400">No images available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Main Image Display */}
      <div className="flex justify-center w-full bg-gray-50 rounded-lg p-4">
        <div className="relative w-full h-[350px] md:h-[430px]">
          <Image
            src={selectedImage}
            alt="Product image"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Thumbnail Images */}
      <div className="flex flex-wrap justify-center items-center gap-3">
        {imageList?.map((item, index) => {
          return (
            <button
              key={index}
              onClick={() => {
                setSelectedImage(item);
              }}
              className={`w-[80px] h-[80px] border-2 rounded-lg p-2 transition-all hover:border-blue-500 ${
                selectedImage === item ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-200"
              }`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={item}
                  alt={`Product thumbnail ${index + 1}`}
                  fill
                  className="object-contain"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}