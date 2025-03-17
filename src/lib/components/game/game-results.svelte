<script lang="ts">
  import { gameStore, isLoading } from '$lib/stores/game-store';
  import { scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  // Function to get score color class
  function getScoreColorClass(score: number): string {
    if (score >= 80) return 'text-success-500';
    if (score >= 60) return 'text-warning-500';
    return 'text-error-500';
  }
  
  // Function to get score label
  function getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent!';
    if (score >= 80) return 'Great!';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Average';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  }
  
  // Reset game function
  function handleReset() {
    gameStore.reset();
  }
</script>

<div 
  class="p-4 bg-surface-700 rounded-lg"
  in:scale={{ duration: 300, easing: quintOut, start: 0.8 }}
>
  {#if $isLoading}
    <div class="flex justify-center p-8">
      <div class="spinner-orbit-center" />
    </div>
  {:else if $gameStore.evaluation}
    <h3 class="h3 mb-4">Prompt Evaluation Results</h3>
    
    <div class="card p-4 variant-glass-surface mb-4">
      <div class="text-center mb-4">
        <div class="text-4xl font-bold {getScoreColorClass($gameStore.evaluation.score)}">
          {$gameStore.evaluation.score}/100
        </div>
        <div class="text-xl mt-1">{getScoreLabel($gameStore.evaluation.score)}</div>
      </div>
      
      <div class="p-4 bg-surface-800 rounded-lg">
        <h4 class="h4 mb-2">Feedback:</h4>
        <p>{$gameStore.evaluation.feedback}</p>
      </div>
    </div>
    
    <div class="mb-4">
      <h4 class="h4 mb-2">Final Prompt:</h4>
      <div class="p-3 bg-surface-900 rounded-lg">
        <p class="font-mono">{$gameStore.currentPrompt}</p>
      </div>
    </div>
    
    <div class="mb-4">
      <h4 class="h4 mb-2">Word Analysis:</h4>
      <div class="flex flex-wrap gap-2">
        {#each $gameStore.words as word}
          <div 
            class="badge {word.isCorrect ? 'variant-filled-success' : 'variant-filled-error'}"
          >
            {word.text}
            {#if word.isCorrect}
              <span class="ml-1">✓</span>
            {:else}
              <span class="ml-1">✗</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    
    <button 
      on:click={handleReset}
      class="btn variant-filled-primary w-full mt-4"
    >
      Play Again
    </button>
  {/if}
</div> 