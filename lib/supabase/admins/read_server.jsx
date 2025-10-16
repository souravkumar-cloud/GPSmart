import { supabase } from '@/lib/supabaseClient';

export const getAdminById = async ({ adminId }) => {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('id', adminId) // ✅ match by the `id` column
    .single();          // only one row expected

  if (error || !data) {
    console.error("❌ Error fetching admin:", error?.message);
    return null;
  }

  return data;
};
