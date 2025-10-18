// lib/brands.js
import { supabase } from '@/lib/supabaseClient';

/**
 * Fetch all brands
 * @returns {Array} Array of brand objects
 */
export const getBrands = async () => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error("❌ Error fetching brands:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("❌ Unexpected error fetching brands:", err.message);
    return [];
  }
};

/**
 * Fetch a single brand by ID
 * @param {Object} params
 * @param {string} params.brandId - ID of the brand to fetch
 * @returns {Object|null} Brand object or null if not found/error
 */
export const getBrandById = async ({ brandId }) => {
  if (!brandId) {
    console.error("❌ Brand ID is required");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    if (error) {
      console.error("❌ Error fetching brand:", error.message);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error("❌ Unexpected error fetching brand:", err.message);
    return null;
  }
};

/**
 * Fetch featured brands
 * @param {Object} params
 * @param {number} params.limit - Maximum number of brands to fetch
 * @returns {Array} Array of featured brand objects
 */
export const getFeaturedBrands = async ({ limit = 10 } = {}) => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('is_featured', true)
      .order('name', { ascending: true })
      .limit(limit);

    if (error) {
      console.error("❌ Error fetching featured brands:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("❌ Unexpected error fetching featured brands:", err.message);
    return [];
  }
};