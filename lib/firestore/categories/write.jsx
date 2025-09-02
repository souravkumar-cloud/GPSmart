import { db, storage } from "@/lib/firebase";
import { collection, doc, setDoc, Timestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export const createNewCategory = async ({ image, data }) => {
  if (!image) throw new Error("Image is Required");
  if (!data?.name) throw new Error("Name is Required");
  if (!data?.slug) throw new Error("Slug is Required");

  // Generate new ID in categories collection
  const newId = doc(collection(db, "categories")).id;

  // Upload image
  const imageRef = ref(storage, `categories/${newId}`);
  await uploadBytes(imageRef, image);
  const imageURL = await getDownloadURL(imageRef);

  // Save Firestore document
  await setDoc(doc(db, "categories", newId), {
    ...data,
    id: newId,
    imageURL,
    timestampCreate: Timestamp.now(),
  });

  console.log("✅ Category created with ID:", newId, "and image:", imageURL);
};
