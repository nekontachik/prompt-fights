// Mock OpenRouter API service for testing without API calls

// Available models for the game
export const AVAILABLE_MODELS = {
  GPT35_TURBO: 'openai/gpt-3.5-turbo',
  LLAMA3: 'meta-llama/llama-3-8b-instruct',
  MIXTRAL: 'mistralai/mixtral-8x7b-instruct',
  NEURAL_CHAT: 'intel/neural-chat-7b'
};

// Topic-based word suggestions
const TOPIC_BASED_WORDS = {
  'product-description': {
    nouns: ['product', 'solution', 'tool', 'device', 'application', 'software', 'system', 'platform', 'service'],
    adjectives: ['innovative', 'powerful', 'efficient', 'intuitive', 'seamless', 'advanced', 'user-friendly', 'reliable'],
    verbs: ['transforms', 'enhances', 'streamlines', 'simplifies', 'accelerates', 'optimizes', 'revolutionizes'],
    connectors: ['that', 'which', 'and', 'while', 'by', 'through', 'using', 'with', 'for']
  },
  'story-prompt': {
    nouns: ['adventure', 'journey', 'character', 'world', 'mystery', 'conflict', 'hero', 'villain', 'setting'],
    adjectives: ['mysterious', 'ancient', 'magical', 'futuristic', 'dystopian', 'enchanted', 'forgotten', 'hidden'],
    verbs: ['discovers', 'encounters', 'reveals', 'transforms', 'battles', 'navigates', 'explores', 'overcomes'],
    connectors: ['who', 'where', 'when', 'while', 'despite', 'through', 'beyond', 'within', 'against']
  },
  'question': {
    nouns: ['concept', 'theory', 'event', 'phenomenon', 'relationship', 'factor', 'principle', 'mechanism'],
    adjectives: ['significant', 'historical', 'scientific', 'philosophical', 'cultural', 'ethical', 'political'],
    verbs: ['influenced', 'affected', 'changed', 'developed', 'evolved', 'contributed', 'impacted'],
    connectors: ['how', 'why', 'what', 'when', 'where', 'which', 'whose', 'whom', 'that']
  }
};

// Get topic category from system prompt
function getTopicCategory(systemPrompt: string): string {
  if (systemPrompt.includes('product description')) return 'product-description';
  if (systemPrompt.includes('story') || systemPrompt.includes('narrative')) return 'story-prompt';
  if (systemPrompt.includes('question')) return 'question';
  return 'product-description'; // default
}

// Analyze current prompt to determine appropriate next word type
function analyzePromptStructure(currentPrompt: string): string {
  const words = currentPrompt.split(/\s+/);
  const lastWord = words[words.length - 1]?.toLowerCase() || '';
  
  // Check for patterns to determine what type of word should come next
  if (lastWord.match(/^(a|an|the|this|that|these|those|my|your|our|their)$/i)) {
    return 'adjectives'; // After articles/determiners, usually an adjective follows
  } else if (lastWord.match(/^(is|are|was|were|be|been|being|seem|appear|become|feels)$/i)) {
    return 'adjectives'; // After linking verbs, usually adjectives
  } else if (lastWord.match(/^(very|quite|extremely|somewhat|rather|fairly|too|so|really)$/i)) {
    return 'adjectives'; // After adverbs of degree, usually adjectives
  } else if (lastWord.match(/^(and|or|but|yet|so|for|nor)$/i)) {
    return Math.random() > 0.5 ? 'nouns' : 'adjectives'; // After conjunctions, could be either
  } else if (lastWord.match(/^(in|on|at|by|with|from|to|for|about|through|over|under|between)$/i)) {
    return 'nouns'; // After prepositions, usually nouns
  } else if (lastWord.match(/^(can|could|will|would|shall|should|may|might|must)$/i)) {
    return 'verbs'; // After modal verbs, usually main verbs
  } else if (words.length > 3 && words.length % 3 === 0) {
    return 'connectors'; // Periodically add connectors for flow
  } else if (lastWord.endsWith('ly')) {
    return 'verbs'; // After adverbs, often verbs
  } else if (lastWord.match(/^(he|she|it|they|we|you|I)$/i)) {
    return 'verbs'; // After pronouns, usually verbs
  } else {
    // If no specific pattern, choose randomly but weighted
    const rand = Math.random();
    if (rand < 0.3) return 'nouns';
    if (rand < 0.6) return 'adjectives';
    if (rand < 0.8) return 'verbs';
    return 'connectors';
  }
}

// Get a contextually appropriate next word
function getContextualWord(currentPrompt: string, topicCategory: string): string {
  const wordType = analyzePromptStructure(currentPrompt);
  const topicWords = TOPIC_BASED_WORDS[topicCategory as keyof typeof TOPIC_BASED_WORDS] || 
                    TOPIC_BASED_WORDS['product-description'];
  
  const wordList = topicWords[wordType as keyof typeof topicWords] || topicWords.nouns;
  const randomIndex = Math.floor(Math.random() * wordList.length);
  
  return wordList[randomIndex];
}

// Mock API call that returns a promise after a short delay
export async function callLLM(prompt: string, systemPrompt?: string): Promise<string> {
  console.log('Mock API call with prompt:', prompt);
  if (systemPrompt) {
    console.log('System prompt:', systemPrompt);
  }
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return 'Hello from mock API!';
}

// Get model's next word suggestion
export async function getNextWord(currentPrompt: string, systemPrompt?: string): Promise<string> {
  console.log('Getting next word for prompt:', currentPrompt);
  
  // Determine topic category from system prompt
  const topicCategory = systemPrompt ? getTopicCategory(systemPrompt) : 'product-description';
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return getContextualWord(currentPrompt, topicCategory);
}

// Evaluate prompt quality
export async function evaluatePrompt(prompt: string, systemPrompt?: string): Promise<{ score: number; feedback: string; }> {
  console.log('Evaluating prompt:', prompt);
  
  // Determine topic category from system prompt
  const topicCategory = systemPrompt ? getTopicCategory(systemPrompt) : 'product-description';
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Calculate a score based on word count, coherence, and topic relevance
  const words = prompt.split(/\s+/);
  const wordCount = words.length;
  
  // Base score from word count (ideal range is 8-15 words)
  let baseScore = 70;
  if (wordCount < 5) baseScore -= 20; // Too short
  else if (wordCount < 8) baseScore -= 10; // A bit short
  else if (wordCount > 20) baseScore -= 15; // Too long
  else if (wordCount > 15) baseScore -= 5; // A bit long
  else baseScore += 10; // Ideal length
  
  // Coherence score - check for repeated words
  const uniqueWords = new Set(words).size;
  const repetitionRatio = uniqueWords / wordCount;
  const coherenceScore = Math.round(repetitionRatio * 20); // 0-20 points
  
  // Topic relevance - check if prompt contains topic-relevant words
  const topicWords = TOPIC_BASED_WORDS[topicCategory as keyof typeof TOPIC_BASED_WORDS];
  let relevantWordCount = 0;
  
  if (topicWords) {
    const allTopicWords = [
      ...topicWords.nouns, 
      ...topicWords.adjectives, 
      ...topicWords.verbs
    ];
    
    words.forEach(word => {
      if (allTopicWords.some(topicWord => word.toLowerCase().includes(topicWord.toLowerCase()))) {
        relevantWordCount++;
      }
    });
  }
  
  const relevanceRatio = relevantWordCount / wordCount;
  const relevanceScore = Math.round(relevanceRatio * 20); // 0-20 points
  
  // Calculate final score
  const finalScore = Math.min(Math.max(baseScore + coherenceScore + relevanceScore, 50), 98);
  
  // Generate feedback
  let feedback = `Your prompt contains ${wordCount} words and has `;
  
  if (finalScore >= 90) {
    feedback += `excellent coherence and relevance to the topic. It's concise, clear, and effectively addresses the ${topicCategory.replace('-', ' ')}.`;
  } else if (finalScore >= 80) {
    feedback += `good coherence and relevance. It addresses the ${topicCategory.replace('-', ' ')} well, with room for minor improvements in ${coherenceScore < 15 ? 'word variety' : 'topic focus'}.`;
  } else if (finalScore >= 70) {
    feedback += `decent coherence and relevance. It's a satisfactory ${topicCategory.replace('-', ' ')}, but could be improved with ${wordCount < 8 ? 'more detail' : wordCount > 15 ? 'more conciseness' : 'better word choice'}.`;
  } else {
    feedback += `room for improvement in both coherence and topic relevance. Consider revising to better address the ${topicCategory.replace('-', ' ')} with ${relevanceScore < 10 ? 'more topic-specific language' : 'better structure'}.`;
  }
  
  return {
    score: finalScore,
    feedback
  };
} 