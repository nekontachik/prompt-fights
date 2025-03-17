import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import GameResults from './game-results.svelte';

// Mock the store imports
vi.mock('$lib/stores/game-store', () => {
  const gameStore = {
    subscribe: vi.fn(),
    reset: vi.fn()
  };
  
  const isLoading = {
    subscribe: vi.fn()
  };
  
  return {
    gameStore,
    isLoading,
    GameMode: {
      EASY: 'easy',
      STANDARD: 'standard',
      EXPERT: 'expert'
    }
  };
});

// Import after mocking
import { gameStore, isLoading } from '$lib/stores/game-store';

describe('GameResults Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  it('should not render content when game is not over', () => {
    // Setup the mock
    vi.mocked(gameStore.subscribe).mockImplementation(callback => {
      callback({
        isGameOver: false,
        playerWords: [],
        aiWords: [],
        playerPrompt: '',
        aiPrompt: '',
        wordBank: [],
        isPlayerTurn: true,
        gameMode: 'standard',
        selectedModel: '',
        isLoading: false,
        playerEvaluation: null,
        aiEvaluation: null,
        error: null,
        startTime: null,
        selectedPromptId: null,
        systemPrompt: '',
        currentTopic: '',
        aiThought: null,
        maxWordsPerSide: 5,
        evaluation: null,
        words: [],
        currentPrompt: ''
      });
      return () => {};
    });
    
    vi.mocked(isLoading.subscribe).mockImplementation(callback => {
      callback(false);
      return () => {};
    });
    
    const { container } = render(GameResults);
    
    // The component should not render content when game is not over
    expect(container.textContent?.trim()).toBe('');
  });
  
  it('should render loading state', () => {
    // Setup the mock
    vi.mocked(gameStore.subscribe).mockImplementation(callback => {
      callback({
        isGameOver: true,
        playerWords: [],
        aiWords: [],
        playerPrompt: '',
        aiPrompt: '',
        wordBank: [],
        isPlayerTurn: true,
        gameMode: 'standard',
        selectedModel: '',
        isLoading: false,
        playerEvaluation: null,
        aiEvaluation: null,
        error: null,
        startTime: null,
        selectedPromptId: null,
        systemPrompt: '',
        currentTopic: '',
        aiThought: null,
        maxWordsPerSide: 5,
        evaluation: null,
        words: [],
        currentPrompt: ''
      });
      return () => {};
    });
    
    vi.mocked(isLoading.subscribe).mockImplementation(callback => {
      callback(true);
      return () => {};
    });
    
    render(GameResults);
    
    // Should show loading spinner
    expect(document.querySelector('.spinner-orbit-center')).toBeTruthy();
  });
}); 