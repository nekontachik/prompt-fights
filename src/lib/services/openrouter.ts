// OpenRouter API service for interacting with various language models

// Types for OpenRouter API
interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
    index: number;
  }[];
  model: string;
}

interface ModelOptions {
  model: string;
  temperature: number;
  max_tokens: number;
}

// Available models for the game
export const AVAILABLE_MODELS = {
  GPT35_TURBO: 'openai/gpt-3.5-turbo',
  LLAMA3: 'meta-llama/llama-3-8b-instruct',
  MIXTRAL: 'mistralai/mixtral-8x7b-instruct',
  NEURAL_CHAT: 'intel/neural-chat-7b'
};

// Default model options
const DEFAULT_OPTIONS: ModelOptions = {
  model: AVAILABLE_MODELS.GPT35_TURBO,
  temperature: 0.7,
  max_tokens: 100
};

// OpenRouter API call
export async function callLLM(
  prompt: string, 
  options: Partial<ModelOptions> = {}
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('OpenRouter API key is missing. Please check your .env file.');
    throw new Error('API key is missing');
  }
  
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    console.log('Calling OpenRouter API with model:', mergedOptions.model);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': import.meta.env.VITE_APP_URL || 'http://localhost:5173',
        'X-Title': 'Prompt Engineering Game'
      },
      body: JSON.stringify({
        model: mergedOptions.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: mergedOptions.temperature,
        max_tokens: mergedOptions.max_tokens
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as OpenRouterResponse;
    
    if (!data.choices || data.choices.length === 0) {
      console.error('Empty response from API:', data);
      throw new Error('Empty response from API');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling LLM:', error);
    throw error;
  }
}

// Get model's next word suggestion
export async function getNextWord(
  currentPrompt: string,
  model: string = AVAILABLE_MODELS.GPT35_TURBO,
  systemPrompt?: string
): Promise<string> {
  const topic = systemPrompt ? 
    `Topic: ${systemPrompt.includes('product description') ? 'Generate a product description' : 
            systemPrompt.includes('story') ? 'Create a story prompt' : 
            systemPrompt.includes('question') ? 'Draft a question' : 
            'Generate a concise prompt'}` : 
    'Generate a concise prompt';

  const prompt = `
    ${topic}

    **SYSTEM:**  
    You are an AI participating in a turn-based game to collaboratively build a single, coherent prompt based on a given topic.  

    ### **Your Role:**  
    1) You are given the current partial prompt (all chosen words so far).  
    2) Your task is to add **exactly one new word** that logically extends the existing partial prompt and aligns with the topic.  
    3) **Do not add entire phrases or sentences**—only **one word** per turn.  
    4) Ensure the final result is a **single, coherent sentence** (or short paragraph) that effectively addresses the topic.  

    ### **Additional Guidelines:**  
    - Avoid redundant, random, or incoherent word choices.
    - Choose a word that maintains grammatical correctness.
    - Select a word that moves the prompt toward completion.
    - Respond with ONLY the single word you're adding, nothing else.

    **Current partial prompt:** "${currentPrompt}"
    
    Your next word (respond with ONLY ONE WORD):
  `;
  
  try {
    const response = await callLLM(prompt, { 
      model, 
      temperature: 0.7,
      max_tokens: 10
    });
    
    // Extract just the first word from the response
    const word = response.trim().split(/\s+/)[0].replace(/[^\w-]/g, '');
    
    if (!word) {
      console.warn('Empty word returned, using fallback');
      return 'the'; // Fallback to a simple word
    }
    
    return word;
  } catch (error) {
    console.error('Error getting next word:', error);
    return 'the'; // Fallback to a simple word on error
  }
}

// Evaluate prompt quality
export async function evaluatePrompt(
  prompt: string,
  model: string = AVAILABLE_MODELS.GPT35_TURBO,
  systemPrompt?: string
): Promise<{ score: number; feedback: string; }> {
  const topic = systemPrompt ? 
    `Topic: ${systemPrompt.includes('product description') ? 'Generate a product description' : 
            systemPrompt.includes('story') ? 'Create a story prompt' : 
            systemPrompt.includes('question') ? 'Draft a question' : 
            'Generate a concise prompt'}` : 
    'Generate a concise prompt';

  const evaluationPrompt = `
    ${topic}

    You are an expert prompt engineer evaluating the quality of a collaboratively built prompt.
    The prompt was built word-by-word, with players taking turns to add one word at a time.
    
    Evaluate the following prompt on a scale of 1-100 based on these criteria:
    1. Relevance to the topic (0-25 points)
    2. Coherence and grammatical correctness (0-25 points)
    3. Clarity and specificity (0-25 points)
    4. Effectiveness for the intended purpose (0-25 points)
    
    Prompt to evaluate: "${prompt}"
    
    Provide your evaluation in JSON format:
    {
      "score": [1-100],
      "feedback": "Your specific, constructive feedback here explaining the strengths and weaknesses"
    }
  `;
  
  try {
    const response = await callLLM(evaluationPrompt, {
      model,
      temperature: 0.3,
      max_tokens: 300
    });
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Error parsing JSON from response:', parseError);
        console.log('Raw response:', response);
      }
    }
    
    // Fallback if JSON parsing fails
    return {
      score: 50,
      feedback: "Could not parse evaluation. The prompt appears to be of average quality."
    };
  } catch (error) {
    console.error('Error evaluating prompt:', error);
    return {
      score: 50,
      feedback: "Error evaluating prompt. Please try again."
    };
  }
} 