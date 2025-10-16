'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Fetch a single product by ID
 */
export async function getProduct(productId) {
  if (!productId) throw new Error('Product ID is required');

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error) {
    console.error('❌ getProduct Error:', error.message);
    throw new Error(error.message);
  }

  console.log('🔍 getProduct - Raw data from database:', data);
  console.log('🔍 getProduct - short_description field:', data?.short_description);
  
  return data;
}

/**
 * Fetch all products with category and brand names
 * @param {Object} options - Query options
 * @param {number} options.limit - Optional limit for number of products to fetch
 * @param {number} options.offset - Optional offset for pagination
 */
export async function getProducts({ limit = null, offset = 0 } = {}) {
  // Build query
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  // Apply pagination if provided
  if (offset > 0) {
    query = query.range(offset, offset + (limit || 10) - 1);
  } else if (limit && limit > 0) {
    query = query.limit(limit);
  }

  const { data: products, error: productsError, count } = await query;

  if (productsError) {
    console.error('❌ getProducts Error:', productsError.message);
    throw new Error(productsError.message);
  }

  if (!products || products.length === 0) return { products: [], count: 0 };

  // Get unique category IDs
  const categoryIds = [...new Set(products.map(p => p.category).filter(Boolean))];
  const brandIds = [...new Set(products.map(p => p.brand).filter(Boolean))];

  // Fetch categories
  let categoryMap = {};
  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', categoryIds);
    
    categories?.forEach(cat => {
      categoryMap[cat.id] = cat.name;
    });
  }

  // Fetch brands
  let brandMap = {};
  if (brandIds.length > 0) {
    const { data: brands } = await supabase
      .from('brands')
      .select('id, name')
      .in('id', brandIds);
    
    brands?.forEach(brand => {
      brandMap[brand.id] = brand.name;
    });
  }

  // Enrich products with names
  const enrichedProducts = products.map(product => ({
    ...product,
    categoryName: categoryMap[product.category] || 'Uncategorized',
    brandName: brandMap[product.brand] || 'No Brand',
  }));

  return { products: enrichedProducts, count };
}

/**
 * Get featured products
 */
export async function getFeaturedProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_featured', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ getFeaturedProducts Error:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Get products by category
 */
export async function getProductsByCategory(categoryId) {
  if (!categoryId) {
    console.error('❌ getProductsByCategory Error: Category ID is required');
    return [];
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', categoryId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ getProductsByCategory Error:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Fetch products by a list of IDs
 */
export async function getProductsByIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error('❌ getProductsByIds Error:', error.message);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * React hook to fetch all products
 * @param {Object} options - Options object
 * @param {number} options.pageLimit - Number of products to fetch per page (optional for client-side pagination)
 * @param {boolean} options.fetchAll - If true, fetches all products for client-side pagination
 */
export function useProducts({ pageLimit, fetchAll = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    // Reset loading state when pageLimit changes
    setLoading(true);

    const fetchOptions = fetchAll ? {} : { limit: pageLimit };

    getProducts(fetchOptions)
      .then((res) => {
        if (isMounted) {
          console.log('Products fetched:', res);
          setData(res.products);
          setTotalCount(res.count || res.products.length);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error fetching products:', err);
          setError(err);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pageLimit, fetchAll]);

  return { data, loading, error, totalCount };
}

/**
 * React hook for server-side pagination
 * @param {Object} options - Options object
 * @param {number} options.pageSize - Number of products per page
 * @param {number} options.currentPage - Current page number (1-indexed)
 */
export function useProductsPaginated({ pageSize = 10, currentPage = 1 } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const offset = (currentPage - 1) * pageSize;

    getProducts({ limit: pageSize, offset })
      .then((res) => {
        if (isMounted) {
          console.log('Products fetched:', res);
          setData(res.products);
          setTotalCount(res.count);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error fetching products:', err);
          setError(err);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pageSize, currentPage]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return { data, loading, error, totalCount, totalPages };
}