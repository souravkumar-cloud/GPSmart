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
 * @deprecated Use processProductOrder instead for proper stock management
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

/**
 * Process an order - decrease stock and increment orders count
 * @param {string} productId - The product ID
 * @param {number} quantity - The quantity ordered (default: 1)
 * @returns {Promise<Object>} Updated product data
 */
export async function processProductOrder(productId, quantity = 1) {
  try {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // First, get the current product data
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock, orders, name')
      .eq('id', productId)
      .single();

    if (fetchError) {
      console.error('Error fetching product:', fetchError);
      throw new Error('Failed to fetch product: ' + fetchError.message);
    }

    if (!product) {
      throw new Error('Product not found');
    }

    const currentStock = product.stock || 0;
    const currentOrders = product.orders || 0;

    // Check if there's enough stock
    if (currentStock < quantity) {
      throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`);
    }

    // Calculate new values
    const newStock = currentStock - quantity;
    const newOrders = currentOrders + quantity;

    // Update the product
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({ 
        stock: newStock,
        orders: newOrders
      })
      .eq('id', productId)
      .select();

    if (updateError) {
      console.error('Error updating product:', updateError);
      throw new Error('Failed to update product: ' + updateError.message);
    }

    console.log(`✅ Order processed for "${product.name}"`);
    console.log(`   Stock: ${currentStock} → ${newStock}`);
    console.log(`   Orders: ${currentOrders} → ${newOrders}`);

    // Revalidate pages
    revalidatePath('/admin/products');
    revalidatePath('/products');
    revalidatePath(`/products/${productId}`);

    return {
      success: true,
      product: updatedProduct?.[0],
      previousStock: currentStock,
      newStock: newStock,
      previousOrders: currentOrders,
      newOrders: newOrders
    };

  } catch (err) {
    console.error('Process product order failed:', err);
    throw err;
  }
}

/**
 * Process multiple products in a single order
 * @param {Array<{productId: string, quantity: number}>} orderItems - Array of order items
 * @returns {Promise<Object>} Results of processing
 */
export async function processMultipleProductsOrder(orderItems) {
  try {
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      throw new Error('Order items array is required');
    }

    const results = {
      success: [],
      failed: []
    };

    // Process each item
    for (const item of orderItems) {
      try {
        const result = await processProductOrder(item.productId, item.quantity);
        results.success.push({
          productId: item.productId,
          quantity: item.quantity,
          result
        });
      } catch (error) {
        console.error(`Failed to process item ${item.productId}:`, error);
        results.failed.push({
          productId: item.productId,
          quantity: item.quantity,
          error: error.message
        });
      }
    }

    console.log(`📦 Order processing complete:`);
    console.log(`   ✅ Successful: ${results.success.length}`);
    console.log(`   ❌ Failed: ${results.failed.length}`);

    // Revalidate pages
    revalidatePath('/admin/products');
    revalidatePath('/products');

    return results;

  } catch (err) {
    console.error('Process multiple products order failed:', err);
    throw err;
  }
}

/**
 * Check if products have sufficient stock
 * @param {Array<{productId: string, quantity: number}>} orderItems - Array of order items
 * @returns {Promise<Object>} Stock validation results
 */
export async function validateProductStock(orderItems) {
  try {
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      throw new Error('Order items array is required');
    }

    const productIds = orderItems.map(item => item.productId);

    // Fetch all products at once
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, stock')
      .in('id', productIds);

    if (error) {
      throw new Error('Failed to validate stock: ' + error.message);
    }

    const validation = {
      valid: true,
      items: []
    };

    // Check each item
    for (const item of orderItems) {
      const product = products.find(p => p.id === item.productId);
      
      if (!product) {
        validation.valid = false;
        validation.items.push({
          productId: item.productId,
          requested: item.quantity,
          available: 0,
          sufficient: false,
          error: 'Product not found'
        });
      } else {
        const sufficient = product.stock >= item.quantity;
        if (!sufficient) {
          validation.valid = false;
        }
        
        validation.items.push({
          productId: item.productId,
          productName: product.name,
          requested: item.quantity,
          available: product.stock,
          sufficient: sufficient
        });
      }
    }

    return validation;

  } catch (err) {
    console.error('Validate product stock failed:', err);
    throw err;
  }
}