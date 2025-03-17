import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabase } from '$lib/services/supabase';

export const GET: RequestHandler = async ({ url }) => {
  try {
    // Get query parameters with defaults
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const gameMode = url.searchParams.get('gameMode') || undefined;
    const model = url.searchParams.get('model') || undefined;
    
    // Validate parameters
    if (limit < 1) {
      return json({ error: 'Limit must be at least 1' }, { status: 400 });
    }
    
    // Build query
    let query = supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);
    
    // Add filters if provided
    if (gameMode) {
      query = query.eq('game_mode', gameMode);
    }
    
    if (model) {
      query = query.eq('model', model);
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching leaderboard:', error);
      return json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
    
    return json({ leaderboard: data });
  } catch (error) {
    console.error('Error processing request:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 