import { writable } from 'svelte/store';
import type { GameStore, GameState } from './game-store';
import { GameMode } from './game-store';

// Create a default initial state
const defaultState: GameState = {
  playerWords: [],
  aiWords: [],
  playerPrompt: '',
  aiPrompt: '',
  wordBank: [],
  isPlayerTurn: true,
  gameMode: GameMode.STANDARD,
  selectedModel: 'gpt-3.5-turbo',
  isGameOver: false,
  isLoading: false,
  playerEvaluation: null,
  aiEvaluation: null,
  error: null,
  startTime: null,
  selectedPromptId: null,
  systemPrompt: '',
  currentTopic: '',
  aiThought: null,
  maxWordsPerSide: 5
};

// Create a mock store that implements the GameStore interface
function createMockGameStore(): GameStore & { _setState: (state: Partial<GameState>) => void } {
  const { subscribe, set, update } = writable<GameState>({ ...defaultState });
  
  return {
    subscribe,
    update,
    reset: () => set({ ...defaultState }),
    setGameMode: (mode: GameMode) => update(state => ({ ...state, gameMode: mode })),
    setModel: (model: string) => update(state => ({ ...state, selectedModel: model })),
    setPrompt: (promptId: string) => update(state => ({ ...state, selectedPromptId: promptId })),
    addPlayerWord: async (wordIndex: number) => {
      update(state => {
        const wordBank = [...state.wordBank];
        const word = wordBank[wordIndex];
        
        if (word && !word.isUsed) {
          word.isUsed = true;
          word.usedBy = 'player';
          
          return {
            ...state,
            wordBank,
            playerWords: [...state.playerWords, { text: word.text, isPlayerWord: true }],
            isPlayerTurn: false
          };
        }
        
        return state;
      });
    },
    aiSelectWord: async () => {
      // Mock implementation
      update(state => {
        const availableWords = state.wordBank.filter(word => !word.isUsed);
        if (availableWords.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableWords.length);
          const selectedWord = availableWords[randomIndex];
          const wordBank = state.wordBank.map(word => 
            word.text === selectedWord.text 
              ? { ...word, isUsed: true, usedBy: 'ai' } 
              : word
          );
          
          return {
            ...state,
            wordBank,
            aiWords: [...state.aiWords, { text: selectedWord.text, isPlayerWord: false }],
            isPlayerTurn: true
          };
        }
        return state;
      });
    },
    endGame: async () => {
      update(state => ({ ...state, isGameOver: true }));
    },
    // Special method for testing to set the state directly
    _setState: (newState: Partial<GameState>) => {
      update(state => ({ ...state, ...newState }));
    }
  };
}

export const mockGameStore = createMockGameStore(); 