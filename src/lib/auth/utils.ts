import { createClient } from '@/lib/supabase/server';
import { createClient as createClientSupabase } from '@/lib/supabase/client';
import { createServerUsersService } from '@/services/users';
import { createUsersService } from '@/services/client/users';
import type { User, UserWithProfile } from '@/types/database';

/**
 * Server-side authentication utilities
 */

/**
 * Get the current authenticated user on the server
 * Returns null if not authenticated
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const usersService = await createServerUsersService();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Get the user from our users table
    return await usersService.getUserById(user.id);
  } catch (error) {
    console.error('Error getting server user:', error);
    return null;
  }
}

/**
 * Get the current authenticated user with their individual profile on the server
 * Auto-creates individual profile if it doesn't exist
 * Returns null if not authenticated
 */
export async function getServerUserWithProfile(): Promise<UserWithProfile | null> {
  try {
    const supabase = await createClient();
    const usersService = await createServerUsersService();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Get user with profile (will auto-create profile if needed)
    return await usersService.getUserWithProfile(user.id);
  } catch (error) {
    console.error('Error getting server user with profile:', error);
    return null;
  }
}

/**
 * Require authentication on the server
 * Throws an error if user is not authenticated
 */
export async function requireServerAuth(): Promise<UserWithProfile> {
  const userWithProfile = await getServerUserWithProfile();
  
  if (!userWithProfile) {
    throw new Error('Authentication required');
  }
  
  return userWithProfile;
}

/**
 * Client-side authentication utilities
 */

/**
 * Get the current authenticated user on the client
 * Returns null if not authenticated
 */
export async function getClientUser(): Promise<User | null> {
  try {
    const usersService = createUsersService();
    return await usersService.getCurrentUser();
  } catch (error) {
    console.error('Error getting client user:', error);
    return null;
  }
}

/**
 * Get the current authenticated user with their individual profile on the client
 * Auto-creates individual profile if it doesn't exist
 * Returns null if not authenticated
 */
export async function getClientUserWithProfile(): Promise<UserWithProfile | null> {
  try {
    const usersService = createUsersService();
    return await usersService.getCurrentUserWithProfile();
  } catch (error) {
    console.error('Error getting client user with profile:', error);
    return null;
  }
}

/**
 * Check if user has completed their individual profile
 */
export function isProfileComplete(userWithProfile: UserWithProfile): boolean {
  const profile = userWithProfile.individual_profile;
  
  if (!profile) return false;
  
  return !!(
    profile.stage_name &&
    profile.primary_instrument &&
    profile.bio &&
    profile.location &&
    profile.instruments && profile.instruments.length > 0 &&
    profile.genres && profile.genres.length > 0
  );
}

/**
 * Sign out user (works on both client and server)
 */
export async function signOut() {
  try {
    // Try client-side first
    if (typeof window !== 'undefined') {
      const supabase = createClientSupabase();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      // Server-side signout
      const supabase = await createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Utility type guards
 */
export function isAuthenticated(user: User | null): user is User {
  return user !== null;
}

export function hasProfile(userWithProfile: UserWithProfile | null): userWithProfile is UserWithProfile & { individual_profile: NonNullable<UserWithProfile['individual_profile']> } {
  return userWithProfile !== null && userWithProfile.individual_profile !== null;
}