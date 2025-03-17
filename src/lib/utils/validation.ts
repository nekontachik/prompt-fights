import type { GameData } from '$lib/services/supabase';
import { GameMode } from '$lib/stores/game-store';
import { AVAILABLE_MODELS } from '$lib/services/openrouter';

// Type for validation errors
export interface ValidationError {
  field: string;
  message: string;
}

// Validate game data before saving to database
export function validateGameData(data: Partial<GameData>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check required fields
  if (!data.user_id) {
    errors.push({ field: 'user_id', message: 'User ID is required' });
  }

  if (!data.prompt) {
    errors.push({ field: 'prompt', message: 'Prompt is required' });
  } else if (data.prompt.length < 3) {
    errors.push({ field: 'prompt', message: 'Prompt must be at least 3 characters long' });
  } else if (data.prompt.length > 1000) {
    errors.push({ field: 'prompt', message: 'Prompt must be less than 1000 characters' });
  }

  if (data.score === undefined || data.score === null) {
    errors.push({ field: 'score', message: 'Score is required' });
  } else if (data.score < 0 || data.score > 100) {
    errors.push({ field: 'score', message: 'Score must be between 0 and 100' });
  }

  if (!data.game_mode) {
    errors.push({ field: 'game_mode', message: 'Game mode is required' });
  } else {
    const validModes = Object.values(GameMode);
    if (!validModes.includes(data.game_mode as GameMode)) {
      errors.push({ 
        field: 'game_mode', 
        message: `Game mode must be one of: ${validModes.join(', ')}` 
      });
    }
  }

  if (!data.model) {
    errors.push({ field: 'model', message: 'Model is required' });
  } else {
    const validModels = Object.values(AVAILABLE_MODELS);
    if (!validModels.includes(data.model)) {
      errors.push({ 
        field: 'model', 
        message: `Model must be one of: ${validModels.map(m => m.split('/').pop()).join(', ')}` 
      });
    }
  }

  if (data.word_count === undefined || data.word_count === null) {
    errors.push({ field: 'word_count', message: 'Word count is required' });
  } else if (data.word_count < 1) {
    errors.push({ field: 'word_count', message: 'Word count must be at least 1' });
  }

  return errors;
}

// Validate user input for prompt words
export function validatePromptWord(word: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!word || word.trim() === '') {
    errors.push({ field: 'word', message: 'Word is required' });
  } else if (!/^[a-zA-Z0-9-]+$/.test(word)) {
    errors.push({ field: 'word', message: 'Word must contain only letters, numbers, and hyphens' });
  } else if (word.length > 30) {
    errors.push({ field: 'word', message: 'Word must be less than 30 characters' });
  }

  return errors;
}

// Validate user profile data
export function validateProfileData(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.username !== undefined) {
    if (data.username.length < 3) {
      errors.push({ field: 'username', message: 'Username must be at least 3 characters long' });
    } else if (data.username.length > 30) {
      errors.push({ field: 'username', message: 'Username must be less than 30 characters' });
    } else if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
      errors.push({ field: 'username', message: 'Username must contain only letters, numbers, underscores, and hyphens' });
    }
  }

  if (data.display_name !== undefined) {
    if (data.display_name.length < 1) {
      errors.push({ field: 'display_name', message: 'Display name is required' });
    } else if (data.display_name.length > 50) {
      errors.push({ field: 'display_name', message: 'Display name must be less than 50 characters' });
    }
  }

  if (data.avatar_url !== undefined && data.avatar_url !== null && data.avatar_url !== '') {
    try {
      new URL(data.avatar_url);
    } catch (e) {
      errors.push({ field: 'avatar_url', message: 'Avatar URL must be a valid URL' });
    }
  }

  return errors;
}

// Helper function to validate and sanitize input
export function sanitizeInput(input: string): string {
  // Remove any HTML tags
  const sanitized = input.replace(/<[^>]*>?/gm, '');
  // Trim whitespace
  return sanitized.trim();
} 