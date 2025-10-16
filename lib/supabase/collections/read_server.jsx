import { supabase } from '@/lib/supabaseClient';

export const getCollectionById = async ({ collectionId }) => {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId) // ✅ match by the `id` column
    .single();            // only one row expected

  if (error || !data) {
    console.error("❌ Error fetching collection:", error?.message);
    return null;
  }

  return data;
};
