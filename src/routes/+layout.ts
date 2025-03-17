// This is a mock implementation for browser compatibility
import { browser } from '$app/environment';
import { supabase } from '$lib/services/mock-supabase';

// Load session data for all routes
export async function load() {
  if (!browser) {
    return {
      session: null
    };
  }

  const { data } = await supabase.auth.getSession();
  
  return {
    session: data.session
  };
} 