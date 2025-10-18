"use client";

import Slider from "react-slick";
import Image from "next/image";

export default function Brands({ brands }) {
  // Check if brands exists and has length
  if (!brands || brands.length === 0) {
    return <></>;
  }

  // Determine the number of slides based on brand count
  const brandCount = brands.length;
  const slidesToShow = Math.min(brandCount, 5);

  var settings = {
    dots: true,
    infinite: brandCount > 1, // Only infinite if more than 1 brand
    speed: 500,
    slidesToShow: slidesToShow,
    slidesToScroll: Math.min(brandCount, 5),
    initialSlide: 0,
    arrows: brandCount > slidesToShow, // Show arrows only if needed
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(brandCount, 4),
          slidesToScroll: Math.min(brandCount, 4),
          infinite: brandCount > 1,
          dots: true,
          arrows: brandCount > 4,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: Math.min(brandCount, 3),
          slidesToScroll: Math.min(brandCount, 3),
          infinite: brandCount > 1,
          arrows: brandCount > 3,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: Math.min(brandCount, 2),
          slidesToScroll: Math.min(brandCount, 2),
          infinite: brandCount > 1,
          arrows: brandCount > 2,
        },
      },
    ],
  };

  return (
    <div className="w-full flex justify-center bg-gray-50 py-8">
      <div className="flex flex-col gap-6 w-full max-w-7xl md:px-10 px-5">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Our Partners
        </h2>
        
        <div className="overflow-hidden">
          <Slider {...settings}>
            {brands?.map((brand, index) => {
              return (
                <div key={brand?.id || index} className="px-3">
                  <div className="flex flex-col gap-3 items-center justify-center">
                    <div 
                      className={`
                        ${brandCount === 1 ? 'h-32 w-64 mx-auto' : 'h-24 w-full'} 
                        rounded-lg md:p-6 p-4 border-2 border-gray-200 
                        bg-white hover:shadow-lg hover:border-blue-300 
                        transition-all duration-300 overflow-hidden relative
                      `}
                    >
                      {brand?.imageURL ? (
                        <Image
                          className="object-contain"
                          src={brand.imageURL}
                          alt={brand?.name || "Brand logo"}
                          fill
                          sizes="(max-width: 480px) 80vw, (max-width: 600px) 60vw, (max-width: 1024px) 40vw, 20vw"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                          No Image
                        </div>
                      )}
                    </div>
                    {brand?.name && (
                      <p className="text-sm font-medium text-gray-700 text-center">
                        {brand.name}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </Slider>
        </div>
      </div>
    </div>
  );
}