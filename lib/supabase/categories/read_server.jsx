import { supabase } from '@/lib/supabaseClient';

export const getCategoryById = async ({ categoryId }) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId) // ✅ match by the `id` column
    .single();            // only one row expected

  if (error || !data) {
    console.error("❌ Error fetching category:", error?.message);
    return null;
  }

  return data;
};
