<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';
  
  export let suggestions: string[] = [];
  export let loading = false;
  
  const dispatch = createEventDispatcher<{
    select: string;
  }>();
  
  function handleSelect(word: string) {
    dispatch('select', word);
  }
  
  // Common prompt engineering words for suggestions
  const commonWords = [
    'create', 'design', 'explain', 'analyze', 'summarize',
    'detailed', 'concise', 'comprehensive', 'step-by-step',
    'expert', 'professional', 'creative', 'innovative',
    'imagine', 'consider', 'develop', 'generate',
    'you', 'I', 'we', 'they', 'should', 'must', 'will',
    'context', 'background', 'scenario', 'situation',
    'specifically', 'particularly', 'especially', 'notably'
  ];
  
  // Get random suggestions if none provided
  $: displaySuggestions = suggestions.length > 0 
    ? suggestions 
    : getRandomSuggestions();
  
  function getRandomSuggestions(count = 5): string[] {
    const shuffled = [...commonWords].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
</script>

<div class="mt-4">
  <h4 class="h4 mb-2">Suggested Words:</h4>
  
  {#if loading}
    <div class="flex justify-center p-4">
      <div class="spinner-orbit-center" />
    </div>
  {:else}
    <div class="flex flex-wrap gap-2">
      {#each displaySuggestions as word, i}
        <button
          on:click={() => handleSelect(word)}
          class="chip variant-soft-primary hover:variant-filled-primary transition-all"
          in:fly={{ y: 10, delay: i * 50 }}
        >
          {word}
        </button>
      {/each}
    </div>
  {/if}
  
  <button 
    on:click={() => displaySuggestions = getRandomSuggestions()}
    class="btn btn-sm variant-ghost-surface mt-2"
  >
    Refresh Suggestions
  </button>
</div> 