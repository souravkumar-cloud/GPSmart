import { supabase } from "@/lib/supabaseClient";

export const createNewCategory = async ({ image, data }) => {
  if (!image) throw new Error("Image is Required");
  if (!data?.name) throw new Error("Name is Required");
  if (!data?.slug) throw new Error("Slug is Required");

  const newId = crypto.randomUUID();
  const bucketName = "gpsmart";

  // Upload image to storage
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(`categories/${newId}.png`, image, {
      contentType: image.type,
    });

  if (uploadError) {
    console.error("❌ Upload Error:", uploadError.message);
    throw uploadError;
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(`categories/${newId}.png`);

  const publicUrl = publicUrlData?.publicUrl;

  // Save in table
  const { error: dbError } = await supabase.from("categories").insert({
    ...data,
    id: newId,
    imageURL: publicUrl,
    created_at: new Date(),
  });

  if (dbError) {
    console.error("❌ DB Insert Error:", dbError.message);
    throw dbError;
  }

  console.log("✅ Category created with ID:", newId);
  return { id: newId, imageURL: publicUrl };
};


export const updateCategory = async ({ id, image, data }) => {
  if (!id) throw new Error("ID is required");
  if (!data?.name) throw new Error("Name is required");
  if (!data?.slug) throw new Error("Slug is required");

  const bucketName = "gpsmart";
  let publicUrl = data?.imageURL; // keep old image if no new one uploaded

  // ✅ Upload new image only if provided
  if (image) {
    const filePath = `categories/${id}-${Date.now()}.png`; // unique name to avoid cache issues
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, image, {
        contentType: image.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError.message);
      throw uploadError;
    }

    const { data: publicUrlData, error: urlError } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (urlError) throw urlError;
    publicUrl = publicUrlData?.publicUrl;
  }

  // ✅ Update category row in DB
  const { error: dbError } = await supabase
    .from("categories")
    .update({
      name: data.name,
      slug: data.slug,
      imageURL: publicUrl,
      updated_at: new Date(),
    })
    .eq("id", id);

  if (dbError) {
    console.error("❌ DB update error:", dbError.message);
    throw dbError;
  }

  console.log("✅ Category updated with ID:", id);
  return { id, imageURL: publicUrl };
};



export const deleteCategory = async ({ id }) => {
  if (!id) {
    throw new Error("ID is required"); // Same validation as original code
  }
  const { error } = await supabase
    .from('categories')    // Table name
    .delete()
    .eq('id', id);         // Delete row where id matches

  if (error) {
    throw error; // Propagate Supabase error for robust error handling
  }
};
