import { supabase } from "@/lib/supabaseClient";

// ---------------- CREATE NEW ADMIN ----------------
export const createNewAdmin = async ({ image, data }) => {
  if (!image) throw new Error("Image is required");
  if (!data?.name) throw new Error("Name is required");
  if (!data?.email) throw new Error("Email is required");

  const newId = crypto.randomUUID();
  const bucketName = "gpsmart";

  // 1️⃣ Upload image to storage
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(`admins/${newId}.png`, image, {
      contentType: image.type,
    });
  if (uploadError) throw uploadError;

  // 2️⃣ Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(`admins/${newId}.png`);
  const publicUrl = publicUrlData?.publicUrl;

  // 3️⃣ Insert row in admins table
  const { error: dbError } = await supabase.from("admins").insert({
    ...data,
    id: newId,
    imageURL: publicUrl,
    created_at: new Date(),
  });
  if (dbError) throw dbError;

  console.log("✅ Admin created with ID:", newId);
  return { id: newId, imageURL: publicUrl };
};

// ---------------- UPDATE ADMIN ----------------
export const updateAdmin = async ({ id, image, data }) => {
  if (!id) throw new Error("ID is required");
  if (!data?.name) throw new Error("Name is required");
  if (!data?.email) throw new Error("Email is required");

  const bucketName = "gpsmart";
  let publicUrl = data?.imageURL; // keep old image if no new one uploaded

  // 1️⃣ Upload new image if provided
  if (image) {
    const filePath = `admins/${id}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, image, {
        contentType: image.type,
        upsert: true,
      });
    if (uploadError) throw uploadError;

    const { data: publicUrlData, error: urlError } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    if (urlError) throw urlError;

    publicUrl = publicUrlData?.publicUrl;
  }

  // 2️⃣ Update admin row in DB
  const { error: dbError } = await supabase
    .from("admins")
    .update({
      name: data.name,
      email: data.email,
      imageURL: publicUrl,
      updated_at: new Date(),
    })
    .eq("id", id);
  if (dbError) throw dbError;

  console.log("✅ Admin updated with ID:", id);
  return { id, imageURL: publicUrl };
};

// ---------------- DELETE ADMIN ----------------
export const deleteAdmin = async ({ id, imageURL }) => {
  if (!id) throw new Error("ID is required");
  const bucketName = "gpsmart";

  // 1️⃣ Delete image from storage if exists
  if (imageURL) {
    try {
      const url = new URL(imageURL);
      const path = decodeURIComponent(
        url.pathname.replace(`/storage/v1/object/${bucketName}/`, "")
      );
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([path]);
      if (storageError) console.error("❌ Storage delete error:", storageError.message);
    } catch (err) {
      console.error("❌ Failed to parse image URL for deletion:", err);
    }
  }

  // 2️⃣ Delete row from DB
  const { error: dbError } = await supabase.from("admins").delete().eq("id", id);
  if (dbError) throw dbError;

  console.log("✅ Admin and image deleted with ID:", id);
};
