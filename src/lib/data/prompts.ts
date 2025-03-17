/**
 * Game prompts for different difficulty levels
 */

export interface GamePrompt {
  id: string;
  difficulty: 'easy' | 'standard' | 'expert';
  title: string;
  description: string;
  systemPrompt: string;
}

export const gamePrompts: GamePrompt[] = [
  {
    id: 'product-description-easy',
    difficulty: 'easy',
    title: 'Product Description (Easy)',
    description: 'Build a prompt to generate a compelling product description',
    systemPrompt: 'You are playing a game to build an optimal prompt for generating a product description. On your turn, choose one word that you think will help create a clear and relevant prompt. Please send only one word along with a brief explanation (one sentence) of why it fits.'
  },
  {
    id: 'product-description-standard',
    difficulty: 'standard',
    title: 'Product Description (Standard)',
    description: 'Create a strategic prompt for an effective product description',
    systemPrompt: 'You are participating in a game where you and your opponent take turns building a prompt for generating a product description. Now, analyze the current state of the prompt (all the words chosen so far) and select the next word that logically complements it and brings it closer to the goal. Please provide your word along with an explanation (1–2 sentences) of how it improves the prompt.'
  },
  {
    id: 'product-description-expert',
    difficulty: 'expert',
    title: 'Product Description (Expert)',
    description: 'Craft an advanced prompt for a sophisticated product description',
    systemPrompt: 'You are an expert AI playing a game to create highly optimized prompts for generating a product description. Analyze the entire context: consider all previously chosen words, potential moves from your opponent, and the final objective of the prompt. Choose the next word that strategically influences the future development of the prompt and helps form the most relevant final prompt. Please send your word along with a detailed explanation (2–3 sentences) of why it is the optimal choice, including its potential benefits and any risks.'
  },
  {
    id: 'story-easy',
    difficulty: 'easy',
    title: 'Short Story (Easy)',
    description: 'Build a prompt to generate an engaging short story',
    systemPrompt: 'You are playing a game to build an optimal prompt for creating a short story. On your turn, choose one word that you think will help create a clear and relevant prompt. Please send only one word along with a brief explanation (one sentence) of why it fits.'
  },
  {
    id: 'story-standard',
    difficulty: 'standard',
    title: 'Short Story (Standard)',
    description: 'Create a strategic prompt for an effective short story',
    systemPrompt: 'You are participating in a game where you and your opponent take turns building a prompt for creating a short story. Now, analyze the current state of the prompt (all the words chosen so far) and select the next word that logically complements it and brings it closer to the goal. Please provide your word along with an explanation (1–2 sentences) of how it improves the prompt.'
  },
  {
    id: 'story-expert',
    difficulty: 'expert',
    title: 'Short Story (Expert)',
    description: 'Craft an advanced prompt for a sophisticated short story',
    systemPrompt: 'You are an expert AI playing a game to create highly optimized prompts for creating a short story. Analyze the entire context: consider all previously chosen words, potential moves from your opponent, and the final objective of the prompt. Choose the next word that strategically influences the future development of the prompt and helps form the most relevant final prompt. Please send your word along with a detailed explanation (2–3 sentences) of why it is the optimal choice, including its potential benefits and any risks.'
  },
  {
    id: 'code-easy',
    difficulty: 'easy',
    title: 'Code Generation (Easy)',
    description: 'Build a prompt to generate useful code',
    systemPrompt: 'You are playing a game to build an optimal prompt for generating code. On your turn, choose one word that you think will help create a clear and relevant prompt. Please send only one word along with a brief explanation (one sentence) of why it fits.'
  },
  {
    id: 'code-standard',
    difficulty: 'standard',
    title: 'Code Generation (Standard)',
    description: 'Create a strategic prompt for effective code generation',
    systemPrompt: 'You are participating in a game where you and your opponent take turns building a prompt for generating code. Now, analyze the current state of the prompt (all the words chosen so far) and select the next word that logically complements it and brings it closer to the goal. Please provide your word along with an explanation (1–2 sentences) of how it improves the prompt.'
  },
  {
    id: 'code-expert',
    difficulty: 'expert',
    title: 'Code Generation (Expert)',
    description: 'Craft an advanced prompt for sophisticated code generation',
    systemPrompt: 'You are an expert AI playing a game to create highly optimized prompts for generating code. Analyze the entire context: consider all previously chosen words, potential moves from your opponent, and the final objective of the prompt. Choose the next word that strategically influences the future development of the prompt and helps form the most relevant final prompt. Please send your word along with a detailed explanation (2–3 sentences) of why it is the optimal choice, including its potential benefits and any risks.'
  },
  {
    id: 'marketing-easy',
    difficulty: 'easy',
    title: 'Marketing Copy (Easy)',
    description: 'Build a prompt to generate effective marketing copy',
    systemPrompt: 'You are playing a game to build an optimal prompt for creating marketing copy. On your turn, choose one word that you think will help create a clear and relevant prompt. Please send only one word along with a brief explanation (one sentence) of why it fits.'
  },
  {
    id: 'marketing-standard',
    difficulty: 'standard',
    title: 'Marketing Copy (Standard)',
    description: 'Create a strategic prompt for compelling marketing copy',
    systemPrompt: 'You are participating in a game where you and your opponent take turns building a prompt for creating marketing copy. Now, analyze the current state of the prompt (all the words chosen so far) and select the next word that logically complements it and brings it closer to the goal. Please provide your word along with an explanation (1–2 sentences) of how it improves the prompt.'
  },
  {
    id: 'marketing-expert',
    difficulty: 'expert',
    title: 'Marketing Copy (Expert)',
    description: 'Craft an advanced prompt for sophisticated marketing copy',
    systemPrompt: 'You are an expert AI playing a game to create highly optimized prompts for creating marketing copy. Analyze the entire context: consider all previously chosen words, potential moves from your opponent, and the final objective of the prompt. Choose the next word that strategically influences the future development of the prompt and helps form the most relevant final prompt. Please send your word along with a detailed explanation (2–3 sentences) of why it is the optimal choice, including its potential benefits and any risks.'
  }
]; 