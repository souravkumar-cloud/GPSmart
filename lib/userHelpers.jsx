// lib/userHelpers.js
import { supabase } from '@/lib/supabaseClient'

/**
 * Get current user's profile from users table
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getCurrentUserProfile() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { data: null, error: authError || new Error('No user found') }
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

/**
 * Update user profile in users table
 * @param {string} userId - User ID
 * @param {object} updates - Fields to update
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

/**
 * Check if user exists in users table
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export async function userExistsInDatabase(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    return !error && !!data
  } catch (err) {
    return false
  }
}

/**
 * Create user profile (fallback if trigger fails)
 * @param {object} user - User object from auth
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createUserProfile(user) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getUserByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

/**
 * Sync auth user metadata with users table
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error: object|null}>}
 */
export async function syncUserMetadata(userId) {
  try {
    // Get auth user data
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: authError || new Error('No user found') }
    }

    // Update users table with auth metadata
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
      })
      .eq('id', userId)

    if (updateError) {
      return { success: false, error: updateError }
    }

    return { success: true, error: null }
  } catch (err) {
    return { success: false, error: err }
  }
}