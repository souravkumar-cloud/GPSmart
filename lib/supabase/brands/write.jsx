import { supabase } from "@/lib/supabaseClient";

/**
 * Create a new brand
 */
export const createNewBrand = async ({ image, data }) => {
  if (!image) throw new Error("Image is required");
  if (!data?.name) throw new Error("Name is required");

  const newId = crypto.randomUUID();
  const bucketName = "gpsmart";

  // Upload image to storage
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(`brands/${newId}.png`, image, {
      contentType: image.type,
    });

  if (uploadError) {
    console.error("❌ Upload Error:", uploadError.message);
    throw uploadError;
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(`brands/${newId}.png`);

  const publicUrl = publicUrlData?.publicUrl;

  // Save in table
  const { error: dbError } = await supabase.from("brands").insert({ // ✅ fixed table name
    ...data,
    id: newId,
    imageURL: publicUrl,
    created_at: new Date(),
  });

  if (dbError) {
    console.error("❌ DB Insert Error:", dbError.message);
    throw dbError;
  }

  console.log("✅ Brand created with ID:", newId);
  return { id: newId, imageURL: publicUrl };
};


export const updateBrand = async ({ id, image, data }) => {
  if (!id) throw new Error("ID is required");
  if (!data?.name) throw new Error("Name is required");

  const bucketName = "gpsmart";
  let publicUrl = data?.imageURL;

  // 1️⃣ Upload new image if provided
  if (image) {
    const filePath = `brands/${id}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, image, { contentType: image.type, upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    publicUrl = publicUrlData.publicUrl;
  }

  // 2️⃣ Update the brands table
  const { error: dbError } = await supabase
    .from("brands")
    .update({ name: data.name, imageURL: publicUrl, updated_at: new Date() })
    .eq("id", id);

  if (dbError) throw dbError;

  console.log("✅ Brand updated with ID:", id);
  return { id, imageURL: publicUrl };
};

/**
 * Delete a brand
 */
export const deleteBrand = async ({ id }) => {
  if (!id) throw new Error("ID is required");

  const { error } = await supabase
    .from("brands") // ✅ fixed table name
    .delete()
    .eq("id", id);

  if (error) throw error;

  console.log("✅ Brand deleted with ID:", id);
};
