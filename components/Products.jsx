'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Rating } from '@mui/material';
import Link from 'next/link';
import { ShoppingCart, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { dispatchCartUpdate, CART_ACTIONS } from '@/lib/cartUtils';
// import { dispatchCartUpdate, CART_ACTIONS } from '@/lib/cartUtils';

export default function ProductGridView({ products }) {
    return (
        <section className="w-full flex justify-center bg-gray-50 py-8">   
            <div className="flex flex-col gap-6 px-4 md:px-6 w-full max-w-7xl">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        Our Products
                    </h1>
                    <p className="text-sm text-gray-500">
                        {products?.length || 0} items
                    </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">   
                    {products?.map((item) => {
                        return <ProductCard key={item.id} product={item} />;
                    })}
                </div>
            </div>
        </section>
    );     
}

function ProductCard({ product }) {
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [showAdded, setShowAdded] = useState(false);

    const imageUrl = Array.isArray(product?.featured_img) 
        ? product.featured_img[0] 
        : product?.featured_img || product?.image_url;

    // Fetch user's cart items
    useEffect(() => {
        if (user?.id) {
            fetchCartItems();
            
            // Real-time subscription for cart updates
            const channel = supabase
                .channel(`cart-product-${product.id}:user_id=eq.${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'cart',
                        filter: `user_id=eq.${user.id}`,
                    },
                    () => {
                        fetchCartItems();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user?.id, product.id]);

    const fetchCartItems = async () => {
        if (!user?.id) return;

        const { data, error } = await supabase
            .from('cart')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching cart:', error);
            return;
        }

        setCartItems(data || []);
    };

    const isInCart = cartItems.find((item) => item?.product_id === product.id);

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsLoading(true);
        
        try {
            if (!user?.id) {
                router.push('/login');
                toast.error('Please log in first!');
                setIsLoading(false);
                return;
            }

            if (isInCart) {
                console.log('Removing from cart...');
                // Optimistically remove from cart
                setCartItems(prev => prev.filter(item => item.product_id !== product.id));

                // Dispatch custom event to update header instantly
                dispatchCartUpdate(CART_ACTIONS.REMOVE);

                // Remove from cart
                const { error } = await supabase
                    .from('cart')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', product.id);

                if (error) {
                    console.error('Remove error:', error);
                    // Revert on error
                    fetchCartItems();
                    dispatchCartUpdate(CART_ACTIONS.ADD);
                    throw error;
                }
                
                toast.success('Removed from cart');
            } else {
                console.log('Adding to cart...');
                // Optimistically add to cart
                const tempCartItem = {
                    id: `temp-${Date.now()}`,
                    user_id: user.id,
                    product_id: product.id,
                    quantity: 1,
                };
                setCartItems(prev => [...prev, tempCartItem]);

                // Dispatch custom event to update header instantly
                dispatchCartUpdate(CART_ACTIONS.ADD);

                // Add to cart
                const { error } = await supabase
                    .from('cart')
                    .insert([
                        {
                            user_id: user.id,
                            product_id: product.id,
                            quantity: 1,
                        },
                    ]);

                if (error) {
                    console.error('Add error:', error);
                    // Revert on error
                    setCartItems(prev => prev.filter(item => item.id !== tempCartItem.id));
                    dispatchCartUpdate(CART_ACTIONS.REMOVE);
                    throw error;
                }
                
                toast.success('Added to cart');
                
                // Show success animation
                setShowAdded(true);
                setTimeout(() => {
                    setShowAdded(false);
                }, 2000);
            }

            // Refresh cart items to get correct data
            await fetchCartItems();
        } catch (error) {
            console.error('Cart error:', error);
            toast.error(error?.message || 'Failed to update cart');
        }
        
        setIsLoading(false);
    };

    const handleBuyNow = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            if (!user?.id) {
                router.push('/login');
                toast.error('Please log in first!');
                return;
            }

            // Add to cart if not already in cart
            if (!isInCart) {
                const { error } = await supabase
                    .from('cart')
                    .insert([
                        {
                            user_id: user.id,
                            product_id: product.id,
                            quantity: 1,
                        },
                    ]);

                if (error) throw error;
            }
            
            router.push('/checkout');
        } catch (error) {
            console.error('Buy now error:', error);
            toast.error(error?.message || 'Failed to proceed');
        }
    };

    const discount = product?.price && product?.sale_price 
        ? Math.round(((product.price - product.sale_price) / product.price) * 100)
        : 0;

    return (
        <Link href={`/product/${product?.id}`}>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full group">
                {/* Image Container - Contains full image with padding */}
                <div className="relative w-full bg-white p-4">
                    <div className="relative w-full aspect-square bg-gray-50 rounded-lg overflow-hidden">
                        {imageUrl ? (
                            <Image 
                                src={imageUrl} 
                                alt={product?.name || 'Product image'}
                                fill
                                className="object-contain group-hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <ShoppingCart size={40} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-xs">No Image</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Container */}
                <div className="p-3 md:p-4 flex flex-col flex-1 border-t">
                    {/* Product Name */}
                    <h3 className="font-semibold text-sm md:text-base text-gray-800 line-clamp-2 mb-2 min-h-[2.5rem]">
                        {product?.name}
                    </h3>

                    {/* Short Description - Hidden on mobile */}
                    {product?.short_description && (
                        <p className="hidden md:block text-xs text-gray-600 line-clamp-2 mb-2">
                            {product.short_description}
                        </p>
                    )}

                    {/* Rating */}
                    <div className="flex gap-2 items-center mb-3">
                        <Rating 
                            name="product-rating" 
                            defaultValue={4.5} 
                            precision={0.5} 
                            size="small" 
                            readOnly
                        />
                        <span className="text-xs text-gray-500">(0)</span>
                    </div>

                    {/* Price Section with Discount in Same Line */}
                    <div className="mb-3 mt-auto">
                        {product?.sale_price ? (
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-lg md:text-xl text-green-600">
                                    ₹{product.sale_price.toLocaleString()}
                                </p>
                                {product?.price && product.price > product.sale_price && (
                                    <>
                                        <p className="text-sm text-gray-500 line-through">
                                            ₹{product.price.toLocaleString()}
                                        </p>
                                        {discount > 0 && (
                                            <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded">
                                                {discount}% OFF
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : product?.price ? (
                            <p className="font-bold text-lg md:text-xl text-gray-800">
                                ₹{product.price.toLocaleString()}
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500">Price not available</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button 
                            onClick={handleAddToCart}
                            disabled={isLoading}
                            className={`flex-shrink-0 p-2 md:px-3 md:py-2 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center ${
                                showAdded 
                                    ? 'bg-green-600 hover:bg-green-700' 
                                    : isInCart 
                                    ? 'bg-red-500 hover:bg-red-600' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                            } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={isInCart ? "Remove from Cart" : "Add to Cart"}
                        >
                            {isLoading ? (
                                <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : showAdded ? (
                                <Check size={18} />
                            ) : (
                                <ShoppingCart size={18} />
                            )}
                        </button>
                        <button 
                            onClick={handleBuyNow}
                            disabled={isLoading}
                            className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}