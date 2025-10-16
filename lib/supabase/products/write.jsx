'use server'

import { supabaseServer as supabase } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'

export async function uploadProductImage(formData) {
  console.log('=== uploadProductImage called ===')
  console.log('FormData type:', typeof formData)
  console.log('FormData is FormData?', formData instanceof FormData)
  
  const file = formData.get('file')
  
  console.log('File extracted:', file)
  console.log('File type:', typeof file)
  console.log('File name:', file?.name)
  console.log('File size:', file?.size)
  
  if (!file || file.size === 0) {
    console.log('No file provided or file is empty');
    return null;
  }

  const fileName = `products/${Date.now()}-${file.name}`;
  console.log('Generated fileName:', fileName)

  try {
    // Convert file to buffer for Supabase
    console.log('Converting to buffer...')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('Buffer size:', buffer.length)

    console.log('Uploading to Supabase storage...')
    const { data, error: uploadError } = await supabase.storage
      .from('gpsmart')
      .upload(fileName, buffer, { 
        contentType: file.type,
        upsert: true 
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      console.error('Error details:', JSON.stringify(uploadError, null, 2));
      throw uploadError;
    }

    console.log('Upload successful, data:', data)

    const { data: publicUrlData } = supabase.storage
      .from('gpsmart')
      .getPublicUrl(fileName);

    console.log('Public URL:', publicUrlData?.publicUrl)
    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.error('uploadProductImage failed:', err);
    console.error('Error stack:', err.stack);
    throw new Error('uploadProductImage failed: ' + err.message);
  }
}

/**
 * Upload multiple featured images and return array of URLs
 */
export async function uploadFeaturedImages(files) {
  console.log('=== uploadFeaturedImages called ===');
  console.log('Number of files:', files?.length);

  if (!files || files.length === 0) {
    console.log('No files provided');
    return [];
  }

  const uploadPromises = files.map(async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const url = await uploadProductImage(formData);
      return url;
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      return null;
    }
  });

  const urls = await Promise.all(uploadPromises);
  const successfulUploads = urls.filter(url => url !== null);
  
  console.log(`✅ Uploaded ${successfulUploads.length}/${files.length} featured images`);
  return successfulUploads;
}

export async function createNewProduct({ data }) {
  try {
    if (!data.name || !data.price || !data.category) {
      throw new Error('Name, Price, and Category are required')
    }

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert([
        {
          name: data.name,
          description: data.description || '',
          short_description: data.short_description || '',
          price: parseFloat(data.price) || 0,
          sale_price: data.sale_price ? parseFloat(data.sale_price) : null,
          category: data.category,
          brand: data.brand || null,
          stock: parseInt(data.stock) || 0,
          orders: 0,
          is_featured: data.is_featured || false,
          image_url: data.image_url || null,
          featured_img: data.featured_img || [], // ✅ JSONB array
        },
      ])
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      throw error
    }

    revalidatePath('/admin/products')
    revalidatePath('/products')

    return newProduct?.[0]
  } catch (err) {
    console.error('Create product failed:', err)
    throw new Error('Create product failed: ' + err.message)
  }
}

export async function updateProduct(id, { data }) {
  try {
    const updateData = {
      name: data.name,
      description: data.description || '',
      short_description: data.short_description || '',
      price: parseFloat(data.price) || 0,
      sale_price: data.sale_price ? parseFloat(data.sale_price) : null,
      category: data.category,
      brand: data.brand || null,
      stock: parseInt(data.stock) || 0,
      is_featured: data.is_featured || false,
      image_url: data.image_url || null,
      featured_img: data.featured_img || [], // ✅ JSONB array
    };

    // Only include orders if it's explicitly provided
    if (data.orders !== undefined) {
      updateData.orders = parseInt(data.orders) || 0;
    }

    console.log('📤 Updating product with data:', updateData);

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase update error:', error)
      throw error
    }

    revalidatePath('/admin/products')
    revalidatePath('/products')

    return updatedProduct?.[0]
  } catch (err) {
    console.error('Update product failed:', err)
    throw new Error('Update product failed: ' + err.message)
  }
}

export async function deleteProduct(id) {
  try {
    console.log('Deleting product:', id);
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Delete error:', error);
      throw error;
    }
    
    console.log('Product deleted successfully');

    revalidatePath('/admin/products')
    revalidatePath('/products')

    return { success: true };
  } catch (err) {
    console.error('Delete product failed:', err);
    throw new Error('Delete product failed: ' + err.message);
  }
}

/**
 * Increment the orders count for a product
 */
export async function incrementProductOrders(productId, quantity = 1) {
  try {
    if (!productId) throw new Error('Product ID is required');

    // First get the current orders count
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('orders')
      .eq('id', productId)
      .single();

    if (fetchError) throw fetchError;

    const currentOrders = product?.orders || 0;
    const newOrders = currentOrders + quantity;

    // Update the orders count
    const { data, error } = await supabase
      .from('products')
      .update({ orders: newOrders })
      .eq('id', productId)
      .select();

    if (error) throw error;

    console.log(`✅ Product ${productId} orders updated: ${currentOrders} → ${newOrders}`);

    revalidatePath('/admin/products')
    revalidatePath('/products')

    return data?.[0];
  } catch (err) {
    console.error('Increment product orders failed:', err);
    throw new Error('Increment product orders failed: ' + err.message);
  }
}