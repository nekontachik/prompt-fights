<script lang="ts">
  import { gameStore as defaultGameStore, GameMode } from '$lib/stores/game-store';
  import { fade, fly, slide, scale } from 'svelte/transition';
  import { animate } from 'motion';
  import GameResults from './game-results.svelte';
  import ModelThinking from './model-thinking.svelte';
  import TopicDisplay from './topic-display.svelte';
  import GameProgress from './game-progress.svelte';
  import { derived, writable } from 'svelte/store';
  import { gamePrompts } from '$lib/data/prompts';
  import { onMount, onDestroy } from 'svelte';
  
  // Allow passing a different store (like mockGameStore)
  export let store = defaultGameStore;
  
  // Create derived stores from the provided store
  const isPlayerTurn = derived(store, $store => $store.isPlayerTurn);
  const isGameOver = derived(store, $store => $store.isGameOver);
  const isLoading = derived(store, $store => $store.isLoading);
  const gameError = derived(store, $store => $store.error);
  const currentTopic = derived(store, $store => $store.currentTopic);
  const aiThought = derived(store, $store => $store.aiThought);
  const wordBank = derived(store, $store => $store.wordBank);
  const playerWords = derived(store, $store => $store.playerWords);
  const aiWords = derived(store, $store => $store.aiWords);
  const maxWordsPerSide = derived(store, $store => $store.maxWordsPerSide);
  const gameMode = derived(store, $store => $store.gameMode);
  
  // Timer functionality
  const turnTimeLimit = 30; // seconds
  let timeRemaining = writable(turnTimeLimit);
  let timerInterval: number | undefined;
  
  // Game modes for the selector
  const gameModes = [
    { value: GameMode.EASY, label: 'Easy', description: 'Simplified AI thinking, fewer words (7)' },
    { value: GameMode.STANDARD, label: 'Standard', description: 'Balanced difficulty, 10 words' },
    { value: GameMode.EXPERT, label: 'Expert', description: 'Complex AI thinking, more words (15)' }
  ];
  
  // Function to change game mode
  function handleGameModeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const newMode = select.value as GameMode;
    store.setGameMode(newMode);
  }
  
  // Function to handle word selection from the word bank
  function handleWordSelect(index: number) {
    store.addPlayerWord(index);
    resetTimer();
  }
  
  function handleEndGame() {
    store.endGame();
    clearInterval(timerInterval);
  }
  
  // Timer functions
  function startTimer() {
    resetTimer();
    timerInterval = setInterval(() => {
      timeRemaining.update(time => {
        if (time <= 0) {
          // Auto-select a word or skip turn when time runs out
          handleTimeOut();
          return turnTimeLimit;
        }
        return time - 1;
      });
    }, 1000);
  }
  
  function resetTimer() {
    timeRemaining.set(turnTimeLimit);
  }
  
  function handleTimeOut() {
    // If it's player's turn and time runs out, select a random available word
    if ($isPlayerTurn && !$isGameOver) {
      const availableWords = $wordBank
        .map((word, index) => ({ word, index }))
        .filter(item => !item.word.isUsed);
      
      if (availableWords.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        handleWordSelect(availableWords[randomIndex].index);
      }
    }
  }
  
  // Lifecycle hooks
  onMount(() => {
    startTimer();
  });
  
  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
  });
  
  // Watch for turn changes to reset timer
  $: if ($isPlayerTurn !== undefined) {
    resetTimer();
  }
  
  // Animate words when they appear
  function animateWord(node: HTMLElement) {
    animate(
      node,
      { 
        scale: [0.5, 1],
        opacity: [0, 1]
      },
      { 
        duration: 0.3,
        easing: 'ease-out'
      }
    );
    
    return {
      destroy() {}
    };
  }
  
  // Function to get a display name for the model
  function getModelDisplayName(modelId: string | undefined): string {
    if (!modelId) return 'Unknown Model';
    
    const modelMap: Record<string, string> = {
      'openai/gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'meta-llama/llama-3-8b-instruct': 'Llama 3 (8B)',
      'mistralai/mixtral-8x7b-instruct': 'Mixtral 8x7B',
      'intel/neural-chat-7b': 'Neural Chat 7B'
    };
    
    return modelMap[modelId] || modelId.split('/').pop() || modelId;
  }
  
  // Calculate synergy score (1-5) based on word position and context
  function calculateSynergy(wordIndex: number): number {
    const word = $wordBank[wordIndex].text;
    const currentPrompt = $playerWords.map(w => w.text).join(' ');
    
    // Simple algorithm - can be improved with more sophisticated logic
    let score = 3; // Default medium score
    
    // Longer words get slightly higher score
    if (word.length > 6) score += 0.5;
    
    // Words that would be repeated get lower score
    if (currentPrompt.includes(word)) score -= 1;
    
    // Words that match the topic get higher score
    if ($currentTopic.toLowerCase().includes(word.toLowerCase())) score += 1;
    
    // Clamp between 1-5
    return Math.max(1, Math.min(5, Math.round(score)));
  }
</script>

<div class="w-full max-w-6xl mx-auto p-4">
  <div class="card p-4 variant-filled-surface">
    <header class="card-header">
      <h2 class="h2">Prompt Engineering Game</h2>
      <div class="flex justify-between items-center mt-2">
        <p class="text-lg font-medium">Round: {$playerWords.length + 1}/{$maxWordsPerSide}</p>
        
        <!-- Timer -->
        {#if !$isGameOver}
          <div class="flex items-center gap-2">
            <div class="w-16 text-center">
              <span class="text-lg font-bold {$timeRemaining < 10 ? 'text-error-500' : ''}">{$timeRemaining}s</span>
            </div>
            <div class="w-32 h-2 bg-surface-700 rounded-full overflow-hidden">
              <div 
                class="h-full bg-primary-500 transition-all duration-1000 ease-linear" 
                style="width: {($timeRemaining / turnTimeLimit) * 100}%"
              ></div>
            </div>
          </div>
        {/if}
      </div>
    </header>
    
    <section class="p-4">
      <!-- Game Rules -->
      <div class="bg-surface-700 p-3 rounded-lg mb-4 text-sm">
        <p>Build a prompt by selecting words from the word bank. Take turns with the AI to create the best prompt that addresses the topic.</p>
      </div>
      
      <!-- Game Mode Selector -->
      {#if $playerWords.length === 0 && $aiWords.length === 0}
        <div class="bg-surface-800 p-3 rounded-lg mb-4">
          <div class="flex flex-col md:flex-row justify-between items-center gap-2">
            <label for="gameMode" class="font-medium">Game Mode:</label>
            <select 
              id="gameMode" 
              class="select w-full md:w-auto" 
              bind:value={$gameMode}
              on:change={handleGameModeChange}
              disabled={$isLoading}
            >
              {#each gameModes as mode}
                <option value={mode.value}>{mode.label} - {mode.description}</option>
              {/each}
            </select>
          </div>
        </div>
      {:else if !$isGameOver}
        <div class="bg-surface-800 p-3 rounded-lg mb-4 flex justify-between items-center">
          <div class="font-medium">
            Current Mode: 
            <span class="text-{$gameMode === GameMode.EASY ? 'tertiary' : $gameMode === GameMode.EXPERT ? 'warning' : 'primary'}-500">
              {$gameMode === GameMode.EASY ? 'Easy' : $gameMode === GameMode.EXPERT ? 'Expert' : 'Standard'}
            </span>
          </div>
          <button 
            class="btn btn-sm variant-ghost-surface"
            on:click={() => store.reset()}
            disabled={$isLoading}
          >
            Reset Game
          </button>
        </div>
      {/if}
      
      <!-- Topic Display -->
      <TopicDisplay topic={$currentTopic} />
      
      <!-- Game Progress -->
      <GameProgress 
        currentStep={Math.min($playerWords.length + $aiWords.length + 1, $maxWordsPerSide * 2)} 
        totalSteps={$maxWordsPerSide * 2}
        isPlayerTurn={$isPlayerTurn}
      />
      
      <!-- Turn Indicator -->
      <div class="text-center mb-4">
        <div class="badge variant-filled-{$isPlayerTurn ? 'primary' : 'secondary'} p-2">
          {$isPlayerTurn ? 'Your Turn' : 'AI\'s Turn'}
        </div>
      </div>
      
      <!-- Main Game Area -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Left Column: Player's Prompt -->
        <div class="bg-surface-800 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-2">
            <h3 class="h3">Your Prompt:</h3>
            <!-- Progress indicator -->
            <div class="flex items-center gap-2">
              <span class="text-sm">{$playerWords.length}/{$maxWordsPerSide}</span>
              <div class="w-24 h-2 bg-surface-700 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-primary-500" 
                  style="width: {($playerWords.length / $maxWordsPerSide) * 100}%"
                ></div>
              </div>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-2 min-h-[100px]">
            {#each $playerWords as word, i}
              <div 
                class="badge variant-filled-primary {word.isCorrect === true ? 'variant-filled-success' : ''} {word.isCorrect === false ? 'variant-filled-error' : ''}"
                use:animateWord
              >
                {word.text}
              </div>
            {/each}
            
            {#if $isPlayerTurn && !$isGameOver}
              <div class="badge variant-ghost-primary animate-pulse">
                Select a word...
              </div>
            {/if}
          </div>
        </div>
        
        <!-- Right Column: AI's Prompt -->
        <div class="bg-surface-800 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-2">
            <h3 class="h3">AI's Prompt:</h3>
            <!-- Progress indicator -->
            <div class="flex items-center gap-2">
              <span class="text-sm">{$aiWords.length}/{$maxWordsPerSide}</span>
              <div class="w-24 h-2 bg-surface-700 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-secondary-500" 
                  style="width: {($aiWords.length / $maxWordsPerSide) * 100}%"
                ></div>
              </div>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-2 min-h-[100px]">
            {#each $aiWords as word, i}
              <div 
                class="badge variant-filled-secondary {word.isCorrect === true ? 'variant-filled-success' : ''} {word.isCorrect === false ? 'variant-filled-error' : ''}"
                use:animateWord
              >
                {word.text}
              </div>
            {/each}
            
            {#if !$isPlayerTurn && !$isGameOver}
              <div class="badge variant-ghost-secondary animate-pulse">
                AI is thinking...
              </div>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Word Bank -->
      {#if !$isGameOver}
        <div class="mt-4 p-4 bg-surface-700 rounded-lg">
          <h3 class="h3 mb-2">Word Bank:</h3>
          <div class="flex flex-wrap gap-2">
            {#each $wordBank as word, i}
              {#if !word.isUsed}
                <div class="flex flex-col items-center">
                  <button 
                    class="badge variant-filled-tertiary hover:variant-filled-primary"
                    disabled={!$isPlayerTurn || $isLoading || $playerWords.length >= $maxWordsPerSide}
                    on:click={() => handleWordSelect(i)}
                    in:scale={{ duration: 200, delay: i * 10 }}
                  >
                    {word.text}
                  </button>
                  
                  <!-- Synergy indicator (stars) -->
                  <div class="flex justify-center mt-1">
                    {#each Array(5) as _, starIndex}
                      <span class="text-xs {starIndex < calculateSynergy(i) ? 'text-warning-500' : 'text-surface-500'}">★</span>
                    {/each}
                  </div>
                </div>
              {:else}
                <div 
                  class="badge variant-ghost-surface opacity-50"
                  out:fade={{ duration: 300 }}
                >
                  {word.text}
                  {#if word.usedBy === 'player'}
                    <span class="ml-1 text-xs">👤</span>
                  {:else if word.usedBy === 'ai'}
                    <span class="ml-1 text-xs">🤖</span>
                  {/if}
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- AI Thinking -->
      {#if !$isPlayerTurn && !$isGameOver && $isLoading}
        <div in:fade={{ duration: 200 }} class="mt-4 p-4 bg-surface-700 rounded-lg">
          <div class="flex items-center mb-3">
            <h3 class="h4 mr-2">AI is Thinking</h3>
            <div class="mini-snail">
              <!-- Updated mini cartoon snail -->
              <div class="mini-snail-body"></div>
              <div class="mini-snail-shell"></div>
              <div class="mini-snail-eye-left"></div>
              <div class="mini-snail-eye-right"></div>
              <div class="mini-snail-antenna-left"></div>
              <div class="mini-snail-antenna-right"></div>
              <div class="mini-snail-smile"></div>
            </div>
          </div>
          <ModelThinking gameMode={$store.gameMode} />
          <p class="mt-2 text-sm">The AI is choosing the next word...</p>
        </div>
      {/if}
      
      <!-- AI Thought Process -->
      {#if $aiThought && $isPlayerTurn && !$isGameOver}
        <div in:slide={{ duration: 300, axis: 'y' }} class="mt-4 p-4 bg-surface-600 rounded-lg">
          <h3 class="h4 mb-2">AI's Thought Process:</h3>
          <p class="text-sm">
            <span class="font-bold">Selected word:</span> 
            <span class="badge variant-filled-secondary">{$aiThought.word}</span>
          </p>
          <p class="text-sm mt-2">
            <span class="font-bold">Reasoning:</span> {$aiThought.explanation}
          </p>
        </div>
      {/if}
      
      <!-- Game Controls -->
      {#if !$isGameOver}
        <div class="mt-4 flex justify-center">
          <button 
            on:click={handleEndGame} 
            class="btn variant-filled-warning"
            disabled={$isLoading || ($playerWords.length < 3 && $aiWords.length < 3)}
          >
            Finish & Evaluate Prompts
          </button>
        </div>
      {:else}
        <div in:fade={{ duration: 200 }} class="mt-4 p-4 bg-surface-700 rounded-lg">
          {#if $store.playerEvaluation && $store.aiEvaluation}
            <h3 class="h3 mb-4">Evaluation Results</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Player's Evaluation -->
              <div class="p-3 rounded-lg {$store.playerEvaluation.score > $store.aiEvaluation.score ? 'bg-success-500/30' : 'bg-surface-600'}">
                <h4 class="h4 mb-2">Your Prompt</h4>
                <p class="text-xl font-bold mb-2">Score: {$store.playerEvaluation.score}/100</p>
                <p class="text-sm">{$store.playerEvaluation.feedback}</p>
              </div>
              
              <!-- AI's Evaluation -->
              <div class="p-3 rounded-lg {$store.aiEvaluation.score > $store.playerEvaluation.score ? 'bg-success-500/30' : 'bg-surface-600'}">
                <h4 class="h4 mb-2">AI's Prompt</h4>
                <p class="text-xl font-bold mb-2">Score: {$store.aiEvaluation.score}/100</p>
                <p class="text-sm">{$store.aiEvaluation.feedback}</p>
              </div>
            </div>
            
            <!-- Winner Announcement -->
            <div class="mt-4 text-center">
              {#if $store.playerEvaluation.score > $store.aiEvaluation.score}
                <p class="text-xl font-bold text-success-500">You win! 🎉</p>
              {:else if $store.playerEvaluation.score < $store.aiEvaluation.score}
                <p class="text-xl font-bold text-warning-500">AI wins! 🤖</p>
              {:else}
                <p class="text-xl font-bold text-tertiary-500">It's a tie! 🤝</p>
              {/if}
            </div>
            
            <button 
              on:click={() => store.reset()} 
              class="btn variant-filled-primary w-full mt-4"
            >
              Play Again
            </button>
          {:else if $isLoading}
            <div class="flex flex-col items-center justify-center p-8">
              <h3 class="h3 mb-6 text-center">Evaluating Prompts</h3>
              
              <!-- Snail Loading Animation -->
              <div class="snail-container relative w-full h-24 mb-4">
                <div class="snail-track w-full h-2 bg-surface-600 rounded-full absolute top-16"></div>
                
                <div class="snail absolute animate-snail-move">
                  <!-- Updated cartoon-style snail -->
                  <div class="snail-body w-12 h-8 bg-[#FFE0A0] rounded-l-full absolute bottom-0"></div>
                  <div class="snail-shell w-10 h-10 rounded-full bg-[#FF7F7F] relative overflow-hidden">
                    <div class="snail-spiral absolute w-8 h-8 border-2 border-black rounded-full top-1 left-1"></div>
                    <div class="snail-spiral-inner absolute w-5 h-5 border-2 border-black rounded-full top-2.5 left-2.5"></div>
                    <div class="snail-spiral-center absolute w-2 h-2 bg-black rounded-full top-4 left-4"></div>
                  </div>
                  <div class="snail-eye-left w-3 h-3 bg-white rounded-full absolute -top-1 left-1 border border-black">
                    <div class="snail-pupil w-1.5 h-1.5 bg-black rounded-full absolute top-0.5 left-0.5"></div>
                    <div class="snail-highlight w-0.5 h-0.5 bg-white rounded-full absolute top-0 left-0"></div>
                  </div>
                  <div class="snail-eye-right w-3 h-3 bg-white rounded-full absolute -top-1 left-6 border border-black">
                    <div class="snail-pupil w-1.5 h-1.5 bg-black rounded-full absolute top-0.5 left-0.5"></div>
                    <div class="snail-highlight w-0.5 h-0.5 bg-white rounded-full absolute top-0 left-0"></div>
                  </div>
                  <div class="snail-antenna-left w-1 h-4 bg-[#FFE0A0] absolute -top-4 left-2 border-r border-black"></div>
                  <div class="snail-antenna-right w-1 h-4 bg-[#FFE0A0] absolute -top-4 left-7 border-r border-black"></div>
                  <div class="snail-antenna-ball-left w-2 h-2 bg-[#FFE0A0] rounded-full absolute -top-5 left-1.5 border border-black"></div>
                  <div class="snail-antenna-ball-right w-2 h-2 bg-[#FFE0A0] rounded-full absolute -top-5 left-6.5 border border-black"></div>
                  <div class="snail-smile w-4 h-2 border-b-2 border-black absolute top-3 left-3.5 rounded-b-full"></div>
                </div>
                
                <div class="loading-text-container w-full overflow-hidden h-6 mt-12">
                  <div class="loading-text whitespace-nowrap animate-loading-text">
                    Evaluating prompts... This snail is working hard to analyze your creativity... Please wait while our slow but thorough evaluator does its job... Almost there...
                  </div>
                </div>
              </div>
              
              <p class="text-sm text-center mt-4 italic">Our evaluation snail is carefully analyzing your prompt...</p>
              <p class="text-xs text-center mt-2 text-tertiary-300">This may take a moment, but quality evaluation takes time!</p>
            </div>
          {/if}
        </div>
      {/if}
      
      <!-- Error Display -->
      {#if $gameError}
        <div class="alert variant-filled-error mt-4" transition:fly={{ y: 20 }}>
          <span>{$gameError}</span>
        </div>
      {/if}
    </section>
    
    <!-- Game Info -->
    <footer class="card-footer flex justify-between">
      <div>
        <span class="badge variant-filled-{$gameMode === GameMode.EASY ? 'tertiary' : $gameMode === GameMode.EXPERT ? 'warning' : 'primary'}">
          Mode: {$gameMode === GameMode.EASY ? 'Easy' : $gameMode === GameMode.EXPERT ? 'Expert' : 'Standard'}
        </span>
      </div>
      <div>
        <span class="badge variant-filled-surface">
          Model: {getModelDisplayName($store.selectedModel)}
        </span>
      </div>
    </footer>
  </div>
</div>

<style>
  /* Snail Animation */
  .animate-snail-move {
    animation: snail-move 20s cubic-bezier(0.45, 0, 0.55, 1) infinite;
    top: 6px;
  }
  
  @keyframes snail-move {
    0% {
      left: 0;
      transform: scaleX(1);
    }
    45% {
      left: calc(100% - 60px);
      transform: scaleX(1);
    }
    50% {
      left: calc(100% - 60px);
      transform: scaleX(-1);
    }
    95% {
      left: 0;
      transform: scaleX(-1);
    }
    100% {
      left: 0;
      transform: scaleX(1);
    }
  }
  
  /* Loading Text Animation */
  .animate-loading-text {
    animation: loading-text 20s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes loading-text {
    0% {
      transform: translateX(100%);
    }
    100% {
      transform: translateX(-100%);
    }
  }
  
  /* Snail slime trail effect */
  .snail-track::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(121, 82, 179, 0.2) 50%, transparent);
    animation: slime-trail 20s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes slime-trail {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  
  /* Mini Snail for AI Thinking */
  .mini-snail {
    position: relative;
    width: 24px;
    height: 24px;
    margin-left: 8px;
  }
  
  .mini-snail-body {
    position: absolute;
    width: 12px;
    height: 8px;
    background-color: #FFE0A0;
    border-radius: 8px 0 0 8px;
    bottom: 0;
    right: 4px;
    border: 1px solid black;
    border-right: none;
  }
  
  .mini-snail-shell {
    position: absolute;
    width: 12px;
    height: 12px;
    background-color: #FF7F7F;
    border-radius: 50%;
    top: 2px;
    right: 0;
    border: 1px solid black;
    overflow: hidden;
    animation: mini-shell-pulse 3s ease-in-out infinite;
  }
  
  .mini-snail-shell::before {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    border: 1px solid black;
    border-radius: 50%;
    top: 1.5px;
    left: 1.5px;
  }
  
  .mini-snail-shell::after {
    content: '';
    position: absolute;
    width: 4px;
    height: 4px;
    border: 1px solid black;
    border-radius: 50%;
    top: 3.5px;
    left: 3.5px;
  }
  
  .mini-snail-eye-left {
    position: absolute;
    width: 3px;
    height: 3px;
    background-color: white;
    border-radius: 50%;
    border: 1px solid black;
    top: 2px;
    left: 4px;
    animation: mini-eye-blink 4s ease-in-out infinite;
  }
  
  .mini-snail-eye-left::after {
    content: '';
    position: absolute;
    width: 1px;
    height: 1px;
    background-color: black;
    border-radius: 50%;
    top: 0.5px;
    left: 0.5px;
  }
  
  .mini-snail-eye-right {
    position: absolute;
    width: 3px;
    height: 3px;
    background-color: white;
    border-radius: 50%;
    border: 1px solid black;
    top: 2px;
    left: 9px;
    animation: mini-eye-blink 4s ease-in-out infinite 0.5s;
  }
  
  .mini-snail-eye-right::after {
    content: '';
    position: absolute;
    width: 1px;
    height: 1px;
    background-color: black;
    border-radius: 50%;
    top: 0.5px;
    left: 0.5px;
  }
  
  .mini-snail-antenna-left {
    position: absolute;
    width: 1px;
    height: 4px;
    background-color: #FFE0A0;
    top: -2px;
    left: 5px;
    border-right: 1px solid black;
    animation: mini-antenna-wave 3s ease-in-out infinite;
  }
  
  .mini-snail-antenna-left::after {
    content: '';
    position: absolute;
    width: 2px;
    height: 2px;
    background-color: #FFE0A0;
    border-radius: 50%;
    border: 1px solid black;
    top: -2px;
    left: -1px;
  }
  
  .mini-snail-antenna-right {
    position: absolute;
    width: 1px;
    height: 4px;
    background-color: #FFE0A0;
    top: -2px;
    left: 10px;
    border-right: 1px solid black;
    animation: mini-antenna-wave 3s ease-in-out infinite 0.5s;
  }
  
  .mini-snail-antenna-right::after {
    content: '';
    position: absolute;
    width: 2px;
    height: 2px;
    background-color: #FFE0A0;
    border-radius: 50%;
    border: 1px solid black;
    top: -2px;
    left: -1px;
  }
  
  .mini-snail-smile {
    position: absolute;
    width: 4px;
    height: 2px;
    border-bottom: 1px solid black;
    border-radius: 0 0 50% 50%;
    top: 6px;
    left: 6px;
  }
  
  @keyframes mini-shell-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes mini-eye-blink {
    0%, 45%, 55%, 100% { height: 3px; }
    50% { height: 0.5px; }
  }
  
  @keyframes mini-antenna-wave {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(10deg); }
    75% { transform: rotate(-10deg); }
  }
  
  /* Add subtle animation to the snail's eyes */
  .snail-eye-left, .snail-eye-right {
    animation: eye-blink 4s ease-in-out infinite;
  }
  
  .snail-eye-right {
    animation-delay: 0.5s;
  }
  
  @keyframes eye-blink {
    0%, 45%, 55%, 100% { height: 3px; }
    50% { height: 0.5px; }
  }
  
  /* Add subtle animation to the snail's antennae */
  .snail-antenna-left, .snail-antenna-right {
    animation: antenna-sway 5s ease-in-out infinite;
  }
  
  .snail-antenna-right {
    animation-delay: 0.5s;
  }
  
  @keyframes antenna-sway {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(5deg); }
    75% { transform: rotate(-5deg); }
  }
</style> 