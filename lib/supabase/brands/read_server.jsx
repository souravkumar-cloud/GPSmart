// lib/brands.js
import { supabase } from '@/lib/supabaseClient';

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
      .from('brands') // ✅ use the correct table name
      .select('*')
      .eq('id', brandId)
      .single();

    if (error) {
      console.error("❌ Error fetching brand:", error.message);
      return null;
    }

    return data || null; // ensure null if no data
  } catch (err) {
    console.error("❌ Unexpected error fetching brand:", err.message);
    return null;
  }
};
