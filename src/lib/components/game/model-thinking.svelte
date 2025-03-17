<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { GameMode } from '$lib/stores/game-store';
  
  // Props
  export let gameMode: GameMode = GameMode.STANDARD;
  
  // Thinking animation states
  let dots = '';
  let interval: number;
  
  // Different thoughts based on game mode
  const thoughtsByMode = {
    [GameMode.EASY]: [
      'Hmm, what word looks fun?',
      'I like colorful words!',
      'This word sounds nice!',
      'Let me pick something cool!',
      'Words are like toys!'
    ],
    [GameMode.STANDARD]: [
      'Analyzing context',
      'Evaluating word options',
      'Considering topic relevance',
      'Checking semantic coherence',
      'Optimizing prompt flow'
    ],
    [GameMode.EXPERT]: [
      'Conducting semantic analysis of lexical options',
      'Evaluating syntactic compatibility with existing prompt',
      'Assessing pragmatic implications of word selection',
      'Optimizing for maximum contextual relevance',
      'Calculating semantic density and information value'
    ]
  };
  
  // Get thoughts based on current game mode
  $: thoughts = thoughtsByMode[gameMode] || thoughtsByMode[GameMode.STANDARD];
  let currentThought = 0;
  
  // Emoji and style based on game mode
  $: emoji = gameMode === GameMode.EASY ? '🤖✨' : 
             gameMode === GameMode.EXPERT ? '🧠💡' : '🤖';
             
  $: thinkingLabel = gameMode === GameMode.EASY ? 'AI is thinking...' : 
                     gameMode === GameMode.EXPERT ? 'AI Cognitive Process' : 'AI Thinking';
  
  onMount(() => {
    // Animate the thinking dots
    interval = setInterval(() => {
      dots = dots.length < 3 ? dots + '.' : '';
    }, 500);
    
    // Cycle through thoughts
    const thoughtInterval = setInterval(() => {
      currentThought = (currentThought + 1) % thoughts.length;
    }, gameMode === GameMode.EXPERT ? 3000 : 2000); // Expert mode thoughts stay longer
    
    return () => {
      clearInterval(interval);
      clearInterval(thoughtInterval);
    };
  });
</script>

<div class="flex flex-col">
  <div class="flex items-center">
    <div class="w-8 h-8 rounded-full bg-{gameMode === GameMode.EASY ? 'tertiary' : gameMode === GameMode.EXPERT ? 'warning' : 'secondary'}-500 flex items-center justify-center mr-2">
      <span class="text-sm">{emoji}</span>
    </div>
    <div class="text-lg font-semibold">{thinkingLabel}</div>
  </div>
  
  <div class="mt-2 pl-10">
    <!-- Animated thinking process -->
    <div class="flex flex-col gap-1">
      {#key currentThought}
        <div 
          in:fly={{ y: 10, duration: 200 }} 
          out:fade={{ duration: 100 }}
          class="font-{gameMode === GameMode.EXPERT ? 'mono' : 'sans'} {gameMode === GameMode.EASY ? 'text-lg' : ''}"
        >
          <span class="text-{gameMode === GameMode.EASY ? 'tertiary' : gameMode === GameMode.EXPERT ? 'warning' : 'secondary'}-300">
            {thoughts[currentThought]}{dots}
          </span>
        </div>
      {/key}
      
      <!-- Animated brain waves - different styles per mode -->
      <div class="flex gap-1 mt-1">
        {#each Array(gameMode === GameMode.EXPERT ? 7 : 5) as _, i}
          <div 
            class="h-{gameMode === GameMode.EASY ? '2' : '1'} w-{gameMode === GameMode.EXPERT ? '3' : '4'} bg-{gameMode === GameMode.EASY ? 'tertiary' : gameMode === GameMode.EXPERT ? 'warning' : 'secondary'}-500 rounded-full" 
            style="animation: {gameMode === GameMode.EASY ? 'bounce' : 'pulse'} {gameMode === GameMode.EXPERT ? 0.3 + i * 0.05 : 0.5 + i * 0.1}s infinite alternate; opacity: {0.4 + i * 0.1};"
          ></div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  @keyframes pulse {
    0% {
      transform: scaleY(0.5);
    }
    100% {
      transform: scaleY(1.5);
    }
  }
  
  @keyframes bounce {
    0% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(-4px);
    }
  }
</style> 