import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/services/supabase';
import { validateGameData, sanitizeInput } from '$lib/utils/validation';

export const POST: RequestHandler = async ({ request, locals }) => {
  // Check if user is authenticated
  const session = await locals.getSession();
  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse request body
    const gameData = await request.json();
    
    // Add user_id from session
    gameData.user_id = session.user.id;
    
    // Sanitize text inputs
    if (gameData.prompt) {
      gameData.prompt = sanitizeInput(gameData.prompt);
    }
    
    // Validate game data
    const errors = validateGameData(gameData);
    if (errors.length > 0) {
      return json({ errors }, { status: 400 });
    }
    
    // Save game data to database
    const { data, error } = await supabase
      .from('games')
      .insert(gameData)
      .select();
    
    if (error) {
      console.error('Error saving game data:', error);
      return json({ error: 'Failed to save game data' }, { status: 500 });
    }
    
    return json({ success: true, data });
  } catch (error) {
    console.error('Error processing request:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ url, locals }) => {
  // Check if user is authenticated
  const session = await locals.getSession();
  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get query parameters
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const userId = url.searchParams.get('userId') || session.user.id;
    
    // Validate parameters
    if (limit < 1 || limit > 100) {
      return json({ error: 'Limit must be between 1 and 100' }, { status: 400 });
    }
    
    // Only allow users to view their own games unless they're an admin
    if (userId !== session.user.id && !session.user.app_metadata?.role === 'admin') {
      return json({ error: 'Unauthorized to view other users\' games' }, { status: 403 });
    }
    
    // Get games from database
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching games:', error);
      return json({ error: 'Failed to fetch games' }, { status: 500 });
    }
    
    return json({ games: data });
  } catch (error) {
    console.error('Error processing request:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 