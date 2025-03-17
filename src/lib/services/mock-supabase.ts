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

// Create a mock user store
export const user = writable<User | null>(null);

// Mock data storage
const mockGames: GameData[] = [];
const mockProfiles: any[] = [];
const mockPrompts: any[] = [];

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
  return { data: newGame, error: null };
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
  
  return { data: userGames, error: null };
}

export async function getLeaderboard(limit = 10, gameMode?: string, model?: string) {
  let leaderboardData = [...mockGames];
  
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
  
  return { data: leaderboardData, error: null };
}

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
    signIn,
    signOut
  },
  from: (table: string) => ({
    insert: (data: any) => {
      if (table === 'games') {
        return {
          select: () => saveGameResult(data)
        };
      }
      console.log(`Inserting into ${table}:`, data);
      return {
        select: () => ({ data, error: null })
      };
    },
    select: (columns = '*') => ({
      eq: (column: string, value: any) => {
        if (table === 'games') {
          return {
            order: () => ({
              limit: (limit: number) => getGames(value, limit)
            })
          };
        }
        if (table === 'leaderboard') {
          return {
            order: () => ({
              limit: (limit: number) => getLeaderboard(limit)
            })
          };
        }
        return {
          order: () => ({
            limit: () => ({ data: [], error: null })
          })
        };
      },
      order: () => ({
        limit: (limit: number) => {
          if (table === 'leaderboard') {
            return getLeaderboard(limit);
          }
          return { data: [], error: null };
        }
      })
    })
  })
};

// Initialize with a mock user for testing
setTimeout(() => {
  signIn();
}, 500); 