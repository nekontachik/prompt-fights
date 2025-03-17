<script lang="ts">
  import { onMount } from 'svelte';
  import PromptBuilder from '$lib/components/game/prompt-builder.svelte';
  import { gameStore } from '$lib/stores/game-store';
  
  let error = '';
  let initialized = false;
  
  onMount(() => {
    try {
      // Initialize the game
      gameStore.reset();
      initialized = true;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      console.error('Error initializing game:', err);
    }
  });
</script>

<div class="container mx-auto">
  {#if error}
    <div class="alert variant-filled-error mb-4">
      <span>Error: {error}</span>
    </div>
  {/if}
  
  {#if initialized}
    <div class="grid grid-cols-1 gap-8">
      <!-- Main Game Area -->
      <PromptBuilder />
    </div>
  {:else}
    <div class="card p-4 variant-filled-surface">
      <p>Initializing game...</p>
      <div class="flex justify-center p-4">
        <div class="spinner-orbit-center" />
      </div>
    </div>
  {/if}
</div> 