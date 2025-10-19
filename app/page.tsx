// import Image from "next/image";
import Header from "../components/Header"
import FeaturedProductSlider from "../components/Slider";
import ProductGridView from "../components/Products";
import { getProducts,getFeaturedProducts } from "../lib/supabase/products/read_server";
import CustomerReviews from "../components/CustomerReview";
import Brands from "../components/Brands";
import { getBrands } from "../lib/supabase/brands/read_server";
import Footer from "../components/Footer";
export default async function Home() {
  const products= await getProducts();
  const brands= await getBrands();
  const featuredProducts= await getFeaturedProducts();
  return (
    <main className="">
      <Header/>
      <FeaturedProductSlider featuredProducts={featuredProducts}/>
      <ProductGridView products={products}/>
      <CustomerReviews/>
      <Brands brands={brands}/>
      <Footer/>
    </main>
  );
}
