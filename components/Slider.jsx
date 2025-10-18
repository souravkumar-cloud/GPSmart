"use client";

import Link from "next/link";
import Slider from "react-slick";

export default function FeaturedProductSlider({ featuredProducts }) {
  // Filter out products without valid image URLs
  const validProducts = featuredProducts?.filter(
    (product) => product?.image_url && product.image_url.trim() !== ""
  );

  // Don't render if no valid products
  if (!validProducts || validProducts.length === 0) {
    return null;
  }

  var settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 2000,
  };

  return (
    <div className="overflow-hidden bg-[#f8f8f8] p-5 md:px-24 md:py-20 w-full">
      <Slider {...settings}>
        {validProducts.map((product) => (
          <div key={product?.id}>
            <div className="flex justify-center items-center">
              <Link href={`/product/${product?.id}`}>
                <img
                  className="h-[14rem] md:h-[23rem] object-contain mx-auto"
                  src={product.image_url}
                  alt={product?.name || "Product image"}
                />
              </Link>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}