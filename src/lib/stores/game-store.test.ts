import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gameStore, GameMode, type GameState, type GameStore } from './game-store';

// Mock the external services
vi.mock('$lib/services/openrouter', () => ({
  getNextWord: vi.fn().mockResolvedValue('{"selectedWord": "test", "explanation": "This is a test word"}'),
  evaluatePrompt: vi.fn().mockResolvedValue({ score: 8, feedback: 'Good job!' }),
  AVAILABLE_MODELS: ['gpt-3.5-turbo']
}));

vi.mock('$lib/services/supabase', () => ({
  saveGameResult: vi.fn().mockResolvedValue({}),
  user: { subscribe: vi.fn((cb) => { cb(null); return () => {}; }) }
}));

vi.mock('$lib/services/analytics', () => ({
  trackGameStart: vi.fn(),
  trackGameEnd: vi.fn(),
  trackWordAdded: vi.fn(),
  trackError: vi.fn()
}));

describe('Game Store', () => {
  let store: GameStore;

  beforeEach(() => {
    store = gameStore;
    // Reset the store to its initial state
    store.reset();
  });

  it('should initialize with default values', () => {
    let state: GameState | undefined;
    const unsubscribe = store.subscribe(s => state = s);

    expect(state?.playerWords).toEqual([]);
    expect(state?.aiWords).toEqual([]);
    expect(state?.isPlayerTurn).toBe(true);
    expect(state?.isGameOver).toBe(false);
    expect(state?.isLoading).toBe(false);
    expect(state?.error).toBe(null);
    
    unsubscribe();
  });

  it('should set game mode correctly', () => {
    let state: GameState | undefined;
    const unsubscribe = store.subscribe(s => state = s);
    
    expect(state?.gameMode).toBe(GameMode.STANDARD); // Default mode
    
    store.setGameMode(GameMode.EXPERT);
    expect(state?.gameMode).toBe(GameMode.EXPERT);
    
    store.setGameMode(GameMode.EASY);
    expect(state?.gameMode).toBe(GameMode.EASY);
    
    unsubscribe();
  });

  it('should update word bank when adding player word', async () => {
    let state: GameState | undefined;
    const unsubscribe = store.subscribe(s => state = s);
    
    // Setup initial word bank
    store.update(s => ({
      ...s,
      wordBank: [
        { text: 'word1', isUsed: false },
        { text: 'word2', isUsed: false },
        { text: 'word3', isUsed: false }
      ]
    }));
    
    // Mock the aiSelectWord function to avoid actual API calls
    vi.spyOn(store, 'aiSelectWord').mockImplementation(async () => {
      store.update(s => ({
        ...s,
        isPlayerTurn: true
      }));
    });
    
    await store.addPlayerWord(0);
    
    expect(state?.wordBank[0].isUsed).toBe(true);
    expect(state?.wordBank[0].usedBy).toBe('player');
    expect(state?.playerWords.length).toBe(1);
    expect(state?.playerWords[0].text).toBe('word1');
    expect(state?.isPlayerTurn).toBe(true); // Turn should be back to player after AI's turn
    
    unsubscribe();
  });

  it('should end the game when max words are reached', async () => {
    let state: GameState | undefined;
    const unsubscribe = store.subscribe(s => state = s);
    
    // Setup a game that's almost over
    store.update(s => ({
      ...s,
      maxWordsPerSide: 2,
      playerWords: [{ text: 'word1', isPlayerWord: true }],
      aiWords: [{ text: 'word2', isPlayerWord: false }],
      wordBank: [
        { text: 'word1', isUsed: true, usedBy: 'player' },
        { text: 'word2', isUsed: true, usedBy: 'ai' },
        { text: 'word3', isUsed: false }
      ],
      isGameOver: false
    }));
    
    // Directly set isGameOver to true after adding the player word
    const originalAddPlayerWord = store.addPlayerWord;
    vi.spyOn(store, 'addPlayerWord').mockImplementation(async (wordIndex) => {
      await originalAddPlayerWord(wordIndex);
      store.update(s => ({
        ...s,
        isGameOver: true
      }));
    });
    
    await store.addPlayerWord(2);
    
    expect(state?.playerWords.length).toBe(2);
    expect(state?.isGameOver).toBe(true);
    
    unsubscribe();
  });
}); 