<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  
  export let currentStep: number;
  export let totalSteps: number;
  export let isPlayerTurn: boolean;
</script>

<div class="w-full mb-4">
  <div class="flex justify-between items-center mb-2">
    <span class="text-sm font-medium">Game Progress</span>
    <span class="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
  </div>
  
  <div class="relative">
    <!-- Progress bar background -->
    <div class="h-3 bg-surface-700 rounded-full overflow-hidden">
      <div 
        class="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500 ease-out" 
        style="width: {(currentStep / totalSteps) * 100}%"
      ></div>
    </div>
    
    <!-- Step markers -->
    <div class="absolute top-0 left-0 w-full h-full flex justify-between px-[1px]">
      {#each Array(totalSteps) as _, i}
        <div 
          class="relative h-3 w-3 rounded-full {i < currentStep ? 'bg-tertiary-500' : 'bg-surface-500'} 
                 {i === currentStep - 1 && isPlayerTurn ? 'ring-2 ring-primary-500 ring-offset-1 ring-offset-surface-900' : ''}
                 {i === currentStep - 1 && !isPlayerTurn ? 'ring-2 ring-secondary-500 ring-offset-1 ring-offset-surface-900' : ''}"
          style="transform: translateX(-50%);"
        >
          {#if i === currentStep - 1}
            <div 
              class="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-{isPlayerTurn ? 'primary' : 'secondary'}-500/30"
              in:scale={{ duration: 300, delay: 100 }}
              out:fade={{ duration: 200 }}
            ></div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div> 