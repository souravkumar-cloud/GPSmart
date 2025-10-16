'use server'

import { supabaseServer as supabase } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export const createNewCategory = async ({ image, data }) => {
  if (!image) throw new Error("Image is Required");
  if (!data?.name) throw new Error("Name is Required");
  if (!data?.slug) throw new Error("Slug is Required");

  const newId = crypto.randomUUID();
  const bucketName = "gpsmart";

  try {
    // Convert image to buffer for server-side upload
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload image to storage
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(`categories/${newId}.png`, buffer, {
        contentType: image.type,
        upsert: true,
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
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("❌ DB Insert Error:", dbError.message);
      throw dbError;
    }

    console.log("✅ Category created with ID:", newId);

    // ✅ Revalidate to show new category immediately
    revalidatePath("/admin/categories");
    revalidatePath("/categories");

    return { id: newId, imageURL: publicUrl };
  } catch (error) {
    console.error("Create category failed:", error);
    throw new Error("Create category failed: " + error.message);
  }
};

export const updateCategory = async ({ id, image, data }) => {
  if (!id) throw new Error("ID is required");
  if (!data?.name) throw new Error("Name is required");
  if (!data?.slug) throw new Error("Slug is required");

  const bucketName = "gpsmart";
  let publicUrl = data?.imageURL; // keep old image if no new one uploaded

  try {
    // ✅ Upload new image only if provided
    if (image) {
      // Convert image to buffer for server-side upload
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filePath = `categories/${id}-${Date.now()}.png`; // unique name to avoid cache issues
      
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, {
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (dbError) {
      console.error("❌ DB update error:", dbError.message);
      throw dbError;
    }

    console.log("✅ Category updated with ID:", id);

    // ✅ Revalidate to show updated category immediately
    revalidatePath("/admin/categories");
    revalidatePath("/categories");

    return { id, imageURL: publicUrl };
  } catch (error) {
    console.error("Update category failed:", error);
    throw new Error("Update category failed: " + error.message);
  }
};

export const deleteCategory = async ({ id, imageURL }) => {
  if (!id) throw new Error("ID is required");

  const bucketName = "gpsmart";

  try {
    // 1️⃣ Delete image from storage (if URL exists)
    if (imageURL) {
      try {
        // Extract the path from public URL
        const url = new URL(imageURL);
        const pathMatch = url.pathname.match(/\/object\/public\/gpsmart\/(.+)$/);
        
        if (pathMatch) {
          const path = pathMatch[1];
          const { error: storageError } = await supabase.storage
            .from(bucketName)
            .remove([path]);

          if (storageError) {
            console.error("❌ Storage delete error:", storageError.message);
            // Continue anyway - don't block deletion
          }
        }
      } catch (urlError) {
        console.error("❌ URL parsing error:", urlError);
        // Continue anyway
      }
    }

    // 2️⃣ Delete row from database
    const { error: dbError } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (dbError) throw dbError;

    console.log("✅ Category and its image deleted:", id);

    // ✅ Revalidate to remove deleted category immediately
    revalidatePath("/admin/categories");
    revalidatePath("/categories");

    return { success: true };
  } catch (error) {
    console.error("Delete category failed:", error);
    throw new Error("Delete category failed: " + error.message);
  }
};