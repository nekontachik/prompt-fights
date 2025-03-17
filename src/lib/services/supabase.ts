// Mock Supabase service for browser compatibility
import { writable, get } from 'svelte/store';

// User type
export interface User {
  id: string;
  email?: string;
  app_metadata?: {
    role?: string;
  };
}

// Game data type
export interface GameData {
  id?: string;
  user_id: string;
  prompt: string;
  score: number;
  game_mode: string;
  model: string;
  word_count: number;
  created_at: Date | string;
}

// Leaderboard entry type
export interface LeaderboardEntry {
  id: string;
  user_id: string;
  username?: string;
  score: number;
  game_mode: string;
  model: string;
  created_at: string;
}

// Create a mock user store
export const user = writable<User | null>(null);

// Mock data storage
const mockGames: GameData[] = [];

// Mock authentication functions
export async function signIn() {
  // Simulate a successful sign-in
  user.set({
    id: 'mock-user-id',
    email: 'user@example.com',
    app_metadata: {
      role: 'user'
    }
  });
  return { error: null };
}

export async function signOut() {
  user.set(null);
  return { error: null };
}

// Mock data functions
export async function saveGameResult(gameData: GameData) {
  const newGame = {
    ...gameData,
    id: `game-${mockGames.length + 1}`,
    created_at: new Date().toISOString()
  };
  mockGames.push(newGame);
  console.log('Game saved:', newGame);
  return [newGame];
}

export async function getGames(userId: string, limit = 10) {
  const userGames = mockGames
    .filter(game => game.user_id === userId)
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Sort by date descending
    })
    .slice(0, limit);
  
  return userGames;
}

export async function getLeaderboard(limit = 10, gameMode?: string, model?: string): Promise<LeaderboardEntry[]> {
  let leaderboardData = [...mockGames].map(game => ({
    id: game.id || '',
    user_id: game.user_id,
    username: `user_${game.user_id.substring(0, 5)}`,
    score: game.score,
    game_mode: game.game_mode,
    model: game.model,
    created_at: typeof game.created_at === 'string' ? game.created_at : game.created_at.toISOString()
  }));
  
  // Apply filters if provided
  if (gameMode) {
    leaderboardData = leaderboardData.filter(game => game.game_mode === gameMode);
  }
  
  if (model) {
    leaderboardData = leaderboardData.filter(game => game.model === model);
  }
  
  // Sort by score descending
  leaderboardData = leaderboardData
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return leaderboardData;
}

export const getUserGames = async (userId: string) => {
  return getGames(userId);
};

// Type for session data
type SessionData = {
  user: User;
};

// Type for auth callback
type AuthChangeCallback = (event: string, session: SessionData | null) => void;

// Mock Supabase client
export const supabase = {
  auth: {
    getSession: async () => {
      const currentUser = get(user);
      return { 
        data: { 
          session: currentUser ? { user: currentUser } : null 
        }, 
        error: null 
      };
    },
    onAuthStateChange: (callback: AuthChangeCallback) => {
      // Unused callback parameter is required to match the real Supabase API
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signIn,
    signOut
  },
  from: (table: string) => ({
    insert: (data: Record<string, unknown>) => {
      if (table === 'games') {
        // Safe type assertion after validating table name
        return {
          select: () => ({ data: saveGameResult(data as unknown as GameData), error: null })
        };
      }
      console.log(`Inserting into ${table}:`, data);
      return {
        select: () => ({ data, error: null })
      };
    },
    select: (columns = '*') => {
      // Columns parameter is required to match the real Supabase API
      return {
        eq: (column: string, value: unknown) => {
          if (table === 'games' && column === 'user_id') {
            return {
              order: () => ({
                limit: (limit: number) => ({ data: getGames(value as string, limit), error: null })
              })
            };
          }
          if (table === 'leaderboard') {
            return {
              order: () => ({
                limit: (limit: number) => ({ data: getLeaderboard(limit), error: null })
              })
            };
          }
          return {
            order: () => ({
              limit: () => ({ data: [], error: null })
            })
          };
        },
        order: (column: string, options?: { ascending?: boolean }) => {
          // Column and options parameters are required to match the real Supabase API
          return {
            limit: (limit: number) => {
              if (table === 'leaderboard') {
                return { data: getLeaderboard(limit), error: null };
              }
              return { data: [], error: null };
            }
          };
        }
      };
    }
  })
};

// Initialize with a mock user for testing
setTimeout(() => {
  signIn();
}, 500); 