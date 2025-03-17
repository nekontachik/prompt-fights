import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ModelThinking from './model-thinking.svelte';
import { mockGameStore } from '$lib/stores/mock-game-store';
import { GameMode, type GameState, type AIThought } from '$lib/stores/game-store';

// Define the extended store type with _setState method
interface MockGameStore {
  _setState: (state: Partial<GameState>) => void;
}

describe('ModelThinking Component', () => {
  beforeEach(() => {
    // Reset the mock store before each test
    mockGameStore.reset();
  });

  it('should not render when AI thought is null', () => {
    const gameState: Partial<GameState> = {
      aiThought: null,
      isPlayerTurn: true
    };

    // Set the state
    if ('_setState' in mockGameStore) {
      (mockGameStore as unknown as MockGameStore)._setState(gameState);
    }

    const { container } = render(ModelThinking, { props: { store: mockGameStore } });
    
    // The component should be empty when there's no AI thought
    expect(container.innerHTML).toBe('');
  });

  it('should render AI thought when available', () => {
    const aiThought: AIThought = {
      word: 'intelligence',
      explanation: 'I chose "intelligence" because it complements the existing words about AI capabilities.'
    };

    const gameState: Partial<GameState> = {
      aiThought,
      isPlayerTurn: false,
      gameMode: GameMode.STANDARD
    };

    // Set the state
    if ('_setState' in mockGameStore) {
      (mockGameStore as unknown as MockGameStore)._setState(gameState);
    }

    render(ModelThinking, { props: { store: mockGameStore } });
    
    // Check for AI thought content
    expect(screen.getByText(/intelligence/i)).toBeTruthy();
    expect(screen.getByText(/I chose "intelligence"/i)).toBeTruthy();
  });

  it('should display different thought styles based on game mode', () => {
    // Test for EASY mode
    const easyThought: AIThought = {
      word: 'simple',
      explanation: 'I chose "simple" because it is straightforward and easy to understand.'
    };

    const easyGameState: Partial<GameState> = {
      aiThought: easyThought,
      isPlayerTurn: false,
      gameMode: GameMode.EASY
    };

    // Set the state for EASY mode
    if ('_setState' in mockGameStore) {
      (mockGameStore as unknown as MockGameStore)._setState(easyGameState);
    }

    render(ModelThinking, { props: { store: mockGameStore } });
    
    // Check for easy mode specific styling or content
    expect(screen.getByText(/simple/i)).toBeTruthy();
    expect(screen.getByText(/I chose "simple"/i)).toBeTruthy();

    // Test for EXPERT mode
    const expertThought: AIThought = {
      word: 'sophisticated',
      explanation: 'I selected "sophisticated" to elevate the semantic complexity of our collaborative prompt.'
    };

    const expertGameState: Partial<GameState> = {
      aiThought: expertThought,
      isPlayerTurn: false,
      gameMode: GameMode.EXPERT
    };

    // Set the state for EXPERT mode
    if ('_setState' in mockGameStore) {
      (mockGameStore as unknown as MockGameStore)._setState(expertGameState);
    }

    // Re-render with expert mode state
    render(ModelThinking, { props: { store: mockGameStore } });
    
    // Check for expert mode specific styling or content
    expect(screen.getByText(/sophisticated/i)).toBeTruthy();
    expect(screen.getByText(/I selected "sophisticated"/i)).toBeTruthy();
  });

  it('should not render when it is player turn', () => {
    const aiThought: AIThought = {
      word: 'intelligence',
      explanation: 'I chose "intelligence" because it complements the existing words about AI capabilities.'
    };

    const gameState: Partial<GameState> = {
      aiThought,
      isPlayerTurn: true // Player's turn, so AI thought should not be shown
    };

    // Set the state
    if ('_setState' in mockGameStore) {
      (mockGameStore as unknown as MockGameStore)._setState(gameState);
    }

    const { container } = render(ModelThinking, { props: { store: mockGameStore } });
    
    // The component should be empty when it's player's turn
    expect(container.innerHTML).toBe('');
  });
}); 