import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import PromptBuilder from './prompt-builder.svelte';
import { mockGameStore } from '$lib/stores/mock-game-store';
import { GameMode, type GameState } from '$lib/stores/game-store';

// Define the extended store type with _setState method
interface MockGameStore {
  _setState: (state: Partial<GameState>) => void;
}

// Mock the child components
vi.mock('./model-thinking.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
    $$typeof: Symbol.for('svelte.component'),
    render: () => ({})
  }))
}));

vi.mock('./game-results.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
    $$typeof: Symbol.for('svelte.component'),
    render: () => ({})
  }))
}));

vi.mock('./topic-display.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
    $$typeof: Symbol.for('svelte.component'),
    render: () => ({})
  }))
}));

vi.mock('./game-progress.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
    $$typeof: Symbol.for('svelte.component'),
    render: () => ({})
  }))
}));

describe('PromptBuilder Component', () => {
  beforeEach(() => {
    // Reset the mock store before each test
    mockGameStore.reset();
    
    // Setup initial state for testing - using a workaround since mockGameStore might not have update method
    const initialState: Partial<GameState> = {
      currentTopic: 'Test Topic',
      wordBank: [
        { text: 'word1', isUsed: false },
        { text: 'word2', isUsed: false },
        { text: 'word3', isUsed: false }
      ],
      gameMode: GameMode.STANDARD,
      playerWords: [],
      aiWords: [],
      playerPrompt: '',
      aiPrompt: '',
      isPlayerTurn: true,
      selectedModel: 'gpt-3.5-turbo',
      isGameOver: false,
      isLoading: false,
      playerEvaluation: null,
      aiEvaluation: null,
      error: null,
      startTime: null,
      selectedPromptId: null,
      systemPrompt: '',
      aiThought: null,
      maxWordsPerSide: 5
    };
    
    // Use the typed _setState method
    if ('_setState' in mockGameStore) {
      (mockGameStore as unknown as MockGameStore)._setState(initialState);
    }
  });

  it('should render the component with word bank', () => {
    const { container } = render(PromptBuilder, { props: { store: mockGameStore } });
    
    // Check if the component renders
    expect(container).toBeTruthy();
    
    // Check if word bank is displayed
    const wordBankItems = screen.getAllByText(/word[1-3]/);
    expect(wordBankItems.length).toBe(3);
  });

  it('should allow selecting a word from the word bank', async () => {
    render(PromptBuilder, { props: { store: mockGameStore } });
    
    // Find and click on a word in the word bank
    const wordElement = screen.getByText('word1');
    await fireEvent.click(wordElement);
    
    // Check if the word was added to player words
    let state: Partial<GameState> | undefined;
    const unsubscribe = mockGameStore.subscribe(s => state = s);
    expect(state?.playerWords?.length).toBeGreaterThan(0);
    if (state?.playerWords?.length) {
      expect(state.playerWords[0].text).toBe('word1');
    }
    unsubscribe();
  });

  it('should display game mode selector', () => {
    render(PromptBuilder, { props: { store: mockGameStore } });
    
    // Check if game mode selector is displayed
    const gameModeSelector = screen.getByLabelText('Game Mode');
    expect(gameModeSelector).toBeTruthy();
    
    // Check if it has the correct options
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(3); // Easy, Standard, Expert
  });

  it('should display reset button when game has started', async () => {
    // Setup a game that has started - using a workaround since mockGameStore might not have update method
    const gameStartedState: Partial<GameState> = {
      playerWords: [{ text: 'word1', isPlayerWord: true }],
      aiWords: [{ text: 'word2', isPlayerWord: false }],
      playerPrompt: '',
      aiPrompt: '',
      wordBank: [
        { text: 'word1', isUsed: true, usedBy: 'player' },
        { text: 'word2', isUsed: true, usedBy: 'ai' },
        { text: 'word3', isUsed: false }
      ],
      isPlayerTurn: false,
      gameMode: GameMode.STANDARD,
      selectedModel: 'gpt-3.5-turbo',
      isGameOver: false,
      isLoading: false,
      playerEvaluation: null,
      aiEvaluation: null,
      error: null,
      startTime: Date.now(),
      selectedPromptId: null,
      systemPrompt: '',
      currentTopic: 'Test Topic',
      aiThought: null,
      maxWordsPerSide: 5
    };
    
    // Use the typed _setState method
    if ('_setState' in mockGameStore) {
      (mockGameStore as unknown as MockGameStore)._setState(gameStartedState);
    }
    
    render(PromptBuilder, { props: { store: mockGameStore } });
    
    // Check if reset button is displayed
    const resetButton = screen.getByText('Reset Game');
    expect(resetButton).toBeTruthy();
    
    // Click reset button
    await fireEvent.click(resetButton);
    
    // Check if game was reset
    let state: Partial<GameState> | undefined;
    const unsubscribe = mockGameStore.subscribe(s => state = s);
    expect(state?.playerWords?.length).toBe(0);
    expect(state?.aiWords?.length).toBe(0);
    unsubscribe();
  });
}); 