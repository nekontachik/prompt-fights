import { writable, derived, type Writable } from 'svelte/store';
import { getNextWord, evaluatePrompt, AVAILABLE_MODELS } from '$lib/services/openrouter';
import { saveGameResult } from '$lib/services/supabase';
import { user } from '$lib/services/supabase';
import { get } from 'svelte/store';
import { trackGameStart, trackGameEnd, trackWordAdded, trackError } from '$lib/services/analytics';
import { gamePrompts, type GamePrompt } from '$lib/data/prompts';

// Types
export interface Word {
  text: string;
  isPlayerWord: boolean;
  isCorrect?: boolean;
}

export interface WordBankItem {
  text: string;
  isUsed: boolean;
  usedBy?: 'player' | 'ai';
}

export interface AIThought {
  word: string;
  explanation: string;
}

export interface GameState {
  playerWords: Word[];
  aiWords: Word[];
  playerPrompt: string;
  aiPrompt: string;
  wordBank: WordBankItem[];
  isPlayerTurn: boolean;
  gameMode: GameMode;
  selectedModel: string;
  isGameOver: boolean;
  isLoading: boolean;
  playerEvaluation: {
    score: number;
    feedback: string;
  } | null;
  aiEvaluation: {
    score: number;
    feedback: string;
  } | null;
  error: string | null;
  startTime: number | null;
  selectedPromptId: string | null;
  systemPrompt: string;
  currentTopic: string;
  aiThought: AIThought | null;
  maxWordsPerSide: number;
}

// Define the type for the game store
export interface GameStore {
  subscribe: Writable<GameState>['subscribe'];
  update: Writable<GameState>['update'];
  reset: () => void;
  setGameMode: (mode: GameMode) => void;
  setModel: (model: string) => void;
  setPrompt: (promptId: string) => void;
  addPlayerWord: (wordIndex: number) => Promise<void>;
  aiSelectWord: () => Promise<void>;
  endGame: () => Promise<void>;
}

export enum GameMode {
  EASY = 'easy',
  STANDARD = 'standard',
  EXPERT = 'expert'
}

// Get default prompt for game mode
function getDefaultPrompt(mode: GameMode): GamePrompt {
  return gamePrompts.find(p => p.difficulty === mode && p.id.includes('product-description')) || gamePrompts[0];
}

// Generate word bank for a topic
function generateWordBank(topic: string): WordBankItem[] {
  // These are example words - in a real implementation, you'd have topic-specific word banks
  const commonWords = [
    'the', 'a', 'an', 'and', 'or', 'but', 'with', 'for', 'in', 'on',
    'to', 'from', 'by', 'at', 'of', 'about', 'that', 'which', 'who', 'when'
  ];
  
  const adjectiveWords = [
    'innovative', 'powerful', 'efficient', 'intuitive', 'seamless', 'advanced',
    'user-friendly', 'reliable', 'modern', 'smart', 'effective', 'premium',
    'affordable', 'sustainable', 'cutting-edge', 'revolutionary', 'elegant', 'robust'
  ];
  
  const nounWords = [
    'product', 'solution', 'tool', 'device', 'application', 'software', 'system',
    'platform', 'service', 'technology', 'experience', 'design', 'feature', 'benefit',
    'quality', 'performance', 'value', 'innovation', 'customer', 'user'
  ];
  
  const verbWords = [
    'transforms', 'enhances', 'streamlines', 'simplifies', 'accelerates', 'optimizes',
    'revolutionizes', 'improves', 'delivers', 'provides', 'offers', 'enables',
    'empowers', 'helps', 'supports', 'creates', 'builds', 'develops'
  ];
  
  // Add some topic-specific words if possible
  let topicWords: string[] = [];
  if (topic.toLowerCase().includes('product')) {
    topicWords = ['features', 'benefits', 'design', 'usability', 'functionality', 'interface'];
  } else if (topic.toLowerCase().includes('marketing')) {
    topicWords = ['campaign', 'audience', 'strategy', 'engagement', 'conversion', 'brand'];
  } else if (topic.toLowerCase().includes('content')) {
    topicWords = ['article', 'blog', 'story', 'narrative', 'message', 'information'];
  }
  
  // Combine all word types and shuffle them
  const allWords = [...commonWords, ...adjectiveWords, ...nounWords, ...verbWords, ...topicWords];
  const shuffledWords = allWords.sort(() => Math.random() - 0.5);
  
  // Take the first 30 words (or however many you want in the word bank)
  return shuffledWords.slice(0, 30).map(text => ({
    text,
    isUsed: false
  }));
}

// Initial state
const defaultPrompt = getDefaultPrompt(GameMode.STANDARD);
const initialState: GameState = {
  playerWords: [],
  aiWords: [],
  playerPrompt: '',
  aiPrompt: '',
  wordBank: generateWordBank(defaultPrompt.title || 'Product Description'),
  isPlayerTurn: true, // Player starts first
  gameMode: GameMode.STANDARD,
  selectedModel: AVAILABLE_MODELS.GPT35_TURBO,
  isGameOver: false,
  isLoading: false,
  playerEvaluation: null,
  aiEvaluation: null,
  error: null,
  startTime: null,
  selectedPromptId: defaultPrompt.id,
  systemPrompt: defaultPrompt.systemPrompt,
  currentTopic: defaultPrompt.title || 'Product Description',
  aiThought: null,
  maxWordsPerSide: 10
};

// Create the store
function createGameStore(): GameStore {
  const { subscribe, set, update } = writable<GameState>(initialState);

  const store: GameStore = {
    subscribe,
    update,
    
    // Reset game
    reset: () => {
      const currentState = get({ subscribe });
      const currentMode = currentState.gameMode;
      const defaultPrompt = getDefaultPrompt(currentMode);
      const newState = {
        ...initialState,
        gameMode: currentMode,
        wordBank: generateWordBank(defaultPrompt.title || 'Product Description'),
        startTime: Date.now(),
        currentTopic: defaultPrompt.title || 'Product Description',
        maxWordsPerSide: currentMode === GameMode.EXPERT ? 15 : currentMode === GameMode.EASY ? 7 : 10
      };
      set(newState);
      
      // Track game start
      trackGameStart(newState.gameMode, newState.selectedModel);
    },
    
    // Set game mode
    setGameMode: (mode: GameMode) => {
      const defaultPrompt = getDefaultPrompt(mode);
      update(state => ({ 
        ...state, 
        gameMode: mode,
        selectedPromptId: defaultPrompt.id,
        systemPrompt: defaultPrompt.systemPrompt,
        currentTopic: defaultPrompt.title || 'Product Description',
        wordBank: generateWordBank(defaultPrompt.title || 'Product Description'),
        maxWordsPerSide: mode === GameMode.EXPERT ? 15 : mode === GameMode.EASY ? 7 : 10
      }));
    },
    
    // Set model
    setModel: (model: string) => update(state => ({ ...state, selectedModel: model })),
    
    // Set prompt
    setPrompt: (promptId: string) => {
      const selectedPrompt = gamePrompts.find(p => p.id === promptId);
      if (selectedPrompt) {
        update(state => ({ 
          ...state, 
          selectedPromptId: promptId,
          systemPrompt: selectedPrompt.systemPrompt,
          gameMode: selectedPrompt.difficulty as GameMode,
          currentTopic: selectedPrompt.title || 'Product Description',
          wordBank: generateWordBank(selectedPrompt.title || 'Product Description')
        }));
      }
    },
    
    // Add player's word from word bank
    addPlayerWord: async (wordIndex: number) => {
      update(state => {
        // Check if the word is already used
        if (state.wordBank[wordIndex].isUsed) {
          return {
            ...state,
            error: 'This word has already been used.'
          };
        }
        
        // Check if player already has max words
        if (state.playerWords.length >= state.maxWordsPerSide) {
          return {
            ...state,
            error: `You can only use ${state.maxWordsPerSide} words.`
          };
        }
        
        // Get the word from the word bank
        const word = state.wordBank[wordIndex].text;
        
        // Update word bank
        const updatedWordBank = [...state.wordBank];
        updatedWordBank[wordIndex] = {
          ...updatedWordBank[wordIndex],
          isUsed: true,
          usedBy: 'player'
        };
        
        // Add player's word
        const newPlayerWords = [...state.playerWords, { text: word, isPlayerWord: true }];
        const newPlayerPrompt = newPlayerWords.map(w => w.text).join(' ');
        
        // Track word added
        trackWordAdded(word, true, newPlayerWords.length);
        
        return {
          ...state,
          wordBank: updatedWordBank,
          playerWords: newPlayerWords,
          playerPrompt: newPlayerPrompt,
          isPlayerTurn: false,
          isLoading: true,
          error: null
        };
      });
      
      try {
        // AI's turn - select a word from the word bank
        await aiSelectWord(store);
      } catch (error) {
        console.error('Error in AI turn:', error);
        
        // Track error
        if (error instanceof Error) {
          trackError(error, { context: 'aiSelectWord' });
        }
        
        update(state => ({
          ...state,
          isLoading: false,
          isPlayerTurn: true,
          error: 'Failed to process AI turn. Please try again.'
        }));
      }
    },
    
    // AI selects a word from the word bank
    aiSelectWord: async () => {
      await aiSelectWord(store);
    },
    
    // End game and evaluate both prompts
    endGame: async () => {
      update(state => ({
        ...state,
        isLoading: true,
        isGameOver: true,
        error: null
      }));
      
      try {
        const currentState = get(gameStore);
        
        // Evaluate player's prompt
        const playerEvaluation = await evaluatePrompt(
          currentState.playerPrompt,
          currentState.selectedModel,
          currentState.systemPrompt
        );
        
        // Evaluate AI's prompt
        const aiEvaluation = await evaluatePrompt(
          currentState.aiPrompt,
          currentState.selectedModel,
          currentState.systemPrompt
        );
        
        // Update words with correctness based on scores
        const updatedPlayerWords = currentState.playerWords.map(word => {
          if (playerEvaluation.score > 70) {
            return { ...word, isCorrect: true };
          } else {
            const correctnessProbability = playerEvaluation.score / 100;
            return { 
              ...word, 
              isCorrect: Math.random() < correctnessProbability 
            };
          }
        });
        
        const updatedAiWords = currentState.aiWords.map(word => {
          if (aiEvaluation.score > 70) {
            return { ...word, isCorrect: true };
          } else {
            const correctnessProbability = aiEvaluation.score / 100;
            return { 
              ...word, 
              isCorrect: Math.random() < correctnessProbability 
            };
          }
        });
        
        // Calculate game duration
        const duration = currentState.startTime 
          ? Math.floor((Date.now() - currentState.startTime) / 1000) 
          : 0;
        
        update(state => ({
          ...state,
          playerWords: updatedPlayerWords,
          aiWords: updatedAiWords,
          playerEvaluation,
          aiEvaluation,
          isLoading: false
        }));
        
        // Track game end
        trackGameEnd(
          currentState.gameMode,
          currentState.selectedModel,
          playerEvaluation.score,
          currentState.playerWords.length,
          duration
        );
        
        // Save game result if user is logged in
        const currentUser = get(user);
        if (currentUser) {
          await saveGameResult({
            user_id: currentUser.id,
            prompt: currentState.playerPrompt,
            score: playerEvaluation.score,
            game_mode: currentState.gameMode,
            model: currentState.selectedModel,
            word_count: currentState.playerWords.length,
            created_at: new Date()
          });
        }
      } catch (error) {
        console.error('Error ending game:', error);
        
        // Track error
        if (error instanceof Error) {
          trackError(error, { context: 'endGame' });
        }
        
        update(state => ({
          ...state,
          isLoading: false,
          error: 'Failed to evaluate prompts. Please try again.'
        }));
      }
    }
  };
  
  return store;
}

// Helper function for AI to select a word
async function aiSelectWord(store: GameStore) {
  const currentState = get(gameStore);
  
  // Check if AI already has max words
  if (currentState.aiWords.length >= currentState.maxWordsPerSide) {
    store.update(state => ({
      ...state,
      isLoading: false,
      isPlayerTurn: true
    }));
    return;
  }
  
  try {
    // Get available words from the word bank
    const availableWords = currentState.wordBank
      .filter(item => !item.isUsed)
      .map(item => item.text);
    
    if (availableWords.length === 0) {
      // No more words available
      store.update(state => ({
        ...state,
        isLoading: false,
        isPlayerTurn: true,
        error: 'No more words available in the word bank.'
      }));
      return;
    }
    
    // Create a prompt for the AI to select a word
    const prompt = `
      Topic: ${currentState.currentTopic}
      
      You are building a prompt about "${currentState.currentTopic}".
      Your current prompt so far: "${currentState.aiPrompt}"
      
      Available words to choose from: ${availableWords.join(', ')}
      
      Select ONE word from the available words that would best extend your prompt.
      Also provide a brief explanation (1-2 sentences) of why you chose this word.
      
      Respond in JSON format:
      {
        "selectedWord": "word",
        "explanation": "Your explanation here"
      }
    `;
    
    // Add a realistic thinking delay (2-5 seconds)
    const thinkingTime = Math.floor(Math.random() * 3000) + 2000; // 2-5 seconds
    await new Promise(resolve => setTimeout(resolve, thinkingTime));
    
    // Get AI's response
    const response = await getNextWord(
      prompt,
      currentState.selectedModel,
      currentState.systemPrompt
    );
    
    // Parse the response to get the selected word and explanation
    let selectedWord = '';
    
    try {
      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        selectedWord = parsedResponse.selectedWord;
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Fallback: use the first word from the response
      selectedWord = response.trim().split(/\s+/)[0];
    }
    
    // Ensure the selected word is in the available words
    if (!availableWords.includes(selectedWord)) {
      // Fallback: select a random word from available words
      selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    }
    
    // Find the index of the selected word in the word bank
    const wordIndex = currentState.wordBank.findIndex(item => item.text === selectedWord);
    
    if (wordIndex === -1) {
      throw new Error('Selected word not found in word bank');
    }
    
    // Generate AI thought based on game mode
    const aiThought = generateAIThought(selectedWord, currentState);
    
    // Update the game state with AI's selection
    store.update(state => {
      // Update word bank
      const updatedWordBank = [...state.wordBank];
      updatedWordBank[wordIndex] = {
        ...updatedWordBank[wordIndex],
        isUsed: true,
        usedBy: 'ai'
      };
      
      // Add AI's word
      const newAiWords = [...state.aiWords, { text: selectedWord, isPlayerWord: false }];
      const newAiPrompt = newAiWords.map(w => w.text).join(' ');
      
      // Track AI word added
      trackWordAdded(selectedWord, false, newAiWords.length);
      
      return {
        ...state,
        wordBank: updatedWordBank,
        aiWords: newAiWords,
        aiPrompt: newAiPrompt,
        aiThought,
        isPlayerTurn: true,
        isLoading: false
      };
    });
    
    // Check if the game should end (both sides have max words)
    const updatedState = get(gameStore);
    if (
      updatedState.playerWords.length >= updatedState.maxWordsPerSide &&
      updatedState.aiWords.length >= updatedState.maxWordsPerSide
    ) {
      // Automatically end the game
      await store.endGame();
    }
  } catch (error) {
    console.error('Error in AI turn:', error);
    
    // Track error
    if (error instanceof Error) {
      trackError(error, { context: 'aiSelectWord' });
    }
    
    store.update(state => ({
      ...state,
      isLoading: false,
      isPlayerTurn: true,
      error: 'Failed to process AI turn. Please try again.'
    }));
  }
}

// Generate AI thought process
function generateAIThought(selectedWord: string, state: GameState): AIThought {
  const currentAIPrompt = state.aiWords.map(w => w.text).join(' ');
  const playerPrompt = state.playerWords.map(w => w.text).join(' ');
  
  // Different reasoning styles based on game mode
  switch (state.gameMode) {
    case GameMode.EASY:
      return generateEasyModeThought(selectedWord, state, currentAIPrompt, playerPrompt);
    case GameMode.EXPERT:
      return generateExpertModeThought(selectedWord, state, currentAIPrompt, playerPrompt);
    case GameMode.STANDARD:
    default:
      return generateStandardModeThought(selectedWord, state, currentAIPrompt, playerPrompt);
  }
}

// Child-like reasoning for Easy mode
function generateEasyModeThought(
  selectedWord: string, 
  state: GameState, 
  currentAIPrompt: string, 
  _playerPrompt: string
): AIThought {
  const childlikeReasons = [
    `I picked "${selectedWord}" because it sounds fun and makes my prompt super cool!`,
    `"${selectedWord}" is a really nice word that makes my prompt about ${state.currentTopic} more colorful!`,
    `I like "${selectedWord}" a lot! It makes my prompt happy and exciting!`,
    `"${selectedWord}" is perfect here! It's like adding sprinkles to ice cream!`,
    `I chose "${selectedWord}" because it's my favorite word right now! It makes everything better!`
  ];
  
  // Position-specific reasoning
  let reasoning;
  if (state.aiWords.length === 0) {
    reasoning = `I'm starting with "${selectedWord}" because it's a super fun word for talking about ${state.currentTopic}!`;
  } else if (state.aiWords.length < 3) {
    reasoning = `I added "${selectedWord}" because it goes really well with "${currentAIPrompt}"! They're best friends!`;
  } else if (state.aiWords.length >= state.maxWordsPerSide - 2) {
    reasoning = `I'm finishing my prompt with "${selectedWord}" because it makes everything sound amazing!`;
  } else {
    reasoning = childlikeReasons[Math.floor(Math.random() * childlikeReasons.length)];
  }
  
  // Add some enthusiasm with emojis occasionally
  if (Math.random() > 0.5) {
    const emojis = ['😊', '✨', '🌟', '🎉', '👍', '❤️'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    reasoning += ` ${randomEmoji}`;
  }
  
  return {
    word: selectedWord,
    explanation: reasoning
  };
}

// Standard reasoning for Standard mode
function generateStandardModeThought(
  selectedWord: string, 
  state: GameState, 
  currentAIPrompt: string, 
  _playerPrompt: string
): AIThought {
  // Reasoning templates
  const reasoningTemplates = [
    `I chose "${selectedWord}" to enhance the clarity of my prompt about ${state.currentTopic}.`,
    `Adding "${selectedWord}" helps create a more specific instruction for ${state.currentTopic}.`,
    `"${selectedWord}" complements my previous words and adds necessary context for ${state.currentTopic}.`,
    `I selected "${selectedWord}" to differentiate my approach from the player's prompt "${_playerPrompt}".`,
    `"${selectedWord}" is a strategic choice that addresses a key aspect of ${state.currentTopic}.`
  ];
  
  // Position-specific reasoning
  let reasoning;
  if (state.aiWords.length === 0) {
    reasoning = `I'm starting with "${selectedWord}" as a foundation for my prompt about ${state.currentTopic}.`;
  } else if (state.aiWords.length < 3) {
    reasoning = `I added "${selectedWord}" to build upon "${currentAIPrompt}" for a stronger opening.`;
  } else if (state.aiWords.length >= state.maxWordsPerSide - 2) {
    reasoning = `I'm concluding my prompt with "${selectedWord}" to finalize my instructions about ${state.currentTopic}.`;
  } else {
    reasoning = reasoningTemplates[Math.floor(Math.random() * reasoningTemplates.length)];
  }
  
  return {
    word: selectedWord,
    explanation: reasoning
  };
}

// Expert reasoning for Expert mode
function generateExpertModeThought(
  selectedWord: string, 
  state: GameState, 
  currentAIPrompt: string, 
  _playerPrompt: string
): AIThought {
  // Expert reasoning templates
  const expertReasoningTemplates = [
    `I've selected "${selectedWord}" due to its semantic compatibility with the existing prompt structure and its capacity to enhance the conceptual framework of ${state.currentTopic}. This lexical choice optimizes the prompt's information density.`,
    `"${selectedWord}" introduces a critical semantic dimension to the prompt, establishing a more nuanced conceptual relationship with the topic of ${state.currentTopic}. The syntactic placement is deliberate to maximize cognitive processing efficiency.`,
    `After analyzing multiple lexical alternatives, I determined that "${selectedWord}" provides optimal semantic value through its polysemic properties and contextual relevance to ${state.currentTopic}, while maintaining syntactic coherence.`,
    `The inclusion of "${selectedWord}" represents a calculated decision to enhance the prompt's pragmatic effectiveness. Its semantic field intersects precisely with the core conceptual requirements of ${state.currentTopic}.`,
    `"${selectedWord}" was selected based on comprehensive linguistic analysis, as it exhibits superior semantic alignment with both the existing prompt elements and the target domain of ${state.currentTopic}. Its information-to-token ratio is exceptionally favorable.`
  ];
  
  // Position-specific expert reasoning
  let reasoning;
  if (state.aiWords.length === 0) {
    reasoning = `I've initiated the prompt construction with "${selectedWord}" as it establishes an optimal semantic foundation for addressing ${state.currentTopic}. This initial lexical selection was made after evaluating multiple alternatives for their conceptual alignment and information value.`;
  } else if (state.aiWords.length < 3) {
    reasoning = `Building upon the established semantic framework of "${currentAIPrompt}", I've incorporated "${selectedWord}" to introduce a critical conceptual dimension that enhances the prompt's specificity regarding ${state.currentTopic}. This selection optimizes the syntactic structure while maintaining maximum relevance.`;
  } else if (state.aiWords.length >= state.maxWordsPerSide - 2) {
    reasoning = `As I approach the conclusion of the prompt construction, I've selected "${selectedWord}" to provide semantic closure and ensure comprehensive coverage of ${state.currentTopic}. This final lexical element was chosen specifically to complement the existing semantic structure while introducing necessary conceptual resolution.`;
  } else {
    reasoning = expertReasoningTemplates[Math.floor(Math.random() * expertReasoningTemplates.length)];
  }
  
  return {
    word: selectedWord,
    explanation: reasoning
  };
}

// Create and export the store
export const gameStore = createGameStore();

// Derived stores for convenience
export const playerPrompt = derived(gameStore, $game => $game.playerPrompt);
export const aiPrompt = derived(gameStore, $game => $game.aiPrompt);
export const isPlayerTurn = derived(gameStore, $game => $game.isPlayerTurn);
export const isGameOver = derived(gameStore, $game => $game.isGameOver);
export const isLoading = derived(gameStore, $game => $game.isLoading);
export const gameError = derived(gameStore, $game => $game.error);
export const currentTopic = derived(gameStore, $game => $game.currentTopic); 