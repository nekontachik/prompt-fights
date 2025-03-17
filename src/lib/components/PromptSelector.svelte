<script lang="ts">
  import { gamePrompts } from '$lib/data/prompts';
  import { mockGameStore, GameMode } from '$lib/stores/mock-game-store';
  import { Select, popup } from '@skeletonlabs/skeleton';
  import type { PopupSettings } from '@skeletonlabs/skeleton';

  // Group prompts by category
  const promptsByCategory: Record<string, typeof gamePrompts> = {};
  
  gamePrompts.forEach(prompt => {
    const category = prompt.id.split('-')[0];
    if (!promptsByCategory[category]) {
      promptsByCategory[category] = [];
    }
    promptsByCategory[category].push(prompt);
  });

  // Popup settings
  const popupPrompts: PopupSettings = {
    event: 'click',
    target: 'popupPrompts',
    placement: 'bottom'
  };

  // Handle prompt selection
  function selectPrompt(promptId: string) {
    $mockGameStore.selectedPromptId = promptId;
    const selectedPrompt = gamePrompts.find(p => p.id === promptId);
    if (selectedPrompt) {
      mockGameStore.setPrompt(promptId);
    }
  }

  // Get current prompt
  $: selectedPrompt = gamePrompts.find(p => p.id === $mockGameStore.selectedPromptId) || gamePrompts[0];
</script>

<div class="prompt-selector w-full">
  <div class="flex flex-col gap-2">
    <div class="flex justify-between items-center">
      <h3 class="h3">Game Prompt</h3>
      <button class="btn variant-ghost-primary" use:popup={popupPrompts}>
        Change Prompt
      </button>
    </div>
    
    <div class="card p-4 variant-filled-surface">
      <h4 class="h4 mb-2">{selectedPrompt.title}</h4>
      <p class="mb-2">{selectedPrompt.description}</p>
      <div class="badge variant-filled-primary">{selectedPrompt.difficulty}</div>
    </div>
  </div>
</div>

<!-- Popup for prompt selection -->
<div class="card p-4 w-72 shadow-xl" data-popup="popupPrompts">
  <div class="flex flex-col gap-4">
    <h3 class="h3">Select Prompt</h3>
    
    {#each Object.entries(promptsByCategory) as [category, prompts]}
      <div class="prompt-category">
        <h4 class="h4 capitalize mb-2">{category}</h4>
        <div class="flex flex-col gap-2">
          {#each prompts as prompt}
            <button 
              class="btn variant-soft-primary text-left justify-start"
              class:variant-filled-primary={prompt.id === $mockGameStore.selectedPromptId}
              on:click={() => selectPrompt(prompt.id)}
            >
              <div>
                <div>{prompt.title}</div>
                <div class="text-xs opacity-70">{prompt.difficulty}</div>
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>
  
  <div class="arrow bg-surface-100-800-token" />
</div> 