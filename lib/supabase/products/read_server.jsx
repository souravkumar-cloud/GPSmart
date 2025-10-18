// lib/supabase/products/read_server.jsx
import { supabaseServer } from '@/lib/supabaseServer';

export async function getProducts() {
  try {
    const { data, error } = await supabaseServer
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ getProducts Error:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("❌ getProducts Exception:", err);
    return [];
  }
}

export async function getProductById({ productId }) {
  try {
    const { data, error } = await supabaseServer
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      console.error("❌ getProductById Error:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("❌ getProductById Exception:", err);
    return null;
  }
}

export async function getFeaturedProducts({ limit = 10 } = {}) {
  try {
    const { data, error } = await supabaseServer
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ getFeaturedProducts Error:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("❌ getFeaturedProducts Exception:", err);
    return [];
  }
}

export async function getProductsByCategory({ categoryId, limit = 20 } = {}) {
  try {
    const { data, error } = await supabaseServer
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ getProductsByCategory Error:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("❌ getProductsByCategory Exception:", err);
    return [];
  }
}

export async function searchProducts({ query, limit = 20 } = {}) {
  try {
    const { data, error } = await supabaseServer
      .from('products')
      .select('*')
      .or(`title.ilike.%${query}%,short_description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ searchProducts Error:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("❌ searchProducts Exception:", err);
    return [];
  }
}

export async function getProductsInStock() {
  try {
    const { data, error } = await supabaseServer
      .from('products')
      .select('*')
      .gt('stock', 0)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ getProductsInStock Error:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("❌ getProductsInStock Exception:", err);
    return [];
  }
}

export async function getProductsWithFilters({ 
  minPrice, 
  maxPrice, 
  categoryId, 
  inStockOnly = false,
  sortBy = 'created_at',
  sortOrder = 'desc',
  limit = 50 
} = {}) {
  try {
    let query = supabaseServer.from('products').select('*');

    // Apply filters
    if (minPrice !== undefined) {
      query = query.gte('sale_price', minPrice);
    }

    if (maxPrice !== undefined) {
      query = query.lte('sale_price', maxPrice);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (inStockOnly) {
      query = query.gt('stock', 0);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply limit
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error("❌ getProductsWithFilters Error:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("❌ getProductsWithFilters Exception:", err);
    return [];
  }
}

// Get products with pagination
export async function getProductsPaginated({ 
  page = 1, 
  pageSize = 20,
  sortBy = 'created_at',
  sortOrder = 'desc'
} = {}) {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const ascending = sortOrder === 'asc';

    const { data, error, count } = await supabaseServer
      .from('products')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending })
      .range(from, to);

    if (error) {
      console.error("❌ getProductsPaginated Error:", error.message);
      return { products: [], totalCount: 0, totalPages: 0 };
    }

    return {
      products: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      currentPage: page
    };
  } catch (err) {
    console.error("❌ getProductsPaginated Exception:", err);
    return { products: [], totalCount: 0, totalPages: 0 };
  }
}